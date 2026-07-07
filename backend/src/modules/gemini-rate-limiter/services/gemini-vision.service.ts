import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiRateLimiterService } from './gemini-rate-limiter.service';

export interface CarAnalysisResult {
  isVehicle: boolean;
  rejectReason: string;
  title: string;
  brandName: string;
  modelName: string;
  bodyType: string;
  manufactureYear: string;
  registrationYear: string;
  mileage: string;
  color: string;
  condition: string;
  fuelType: string;
  transmission: string;
  engineCapacity: string;
  enginePower: string;
  batteryCapacity: string;
  rangePerCharge: string;
  licensePlate: string;
  origin: string;
  documentsStatus: string;
  seatCount: string;
  doorCount: string;
  wheelCount: string;
  payloadKg: string;
  grossWeightKg: string;
  extraSpecs: Record<string, unknown>;
  confidence: number;
  notes: string[];
}

export interface PriceComparable {
  title: string;
  price: number;
  province?: string;
  brandName?: string;
  modelName?: string;
  bodyType?: string;
  manufactureYear?: number;
  mileage?: number;
  condition?: string;
  fuelType?: string;
  transmission?: string;
}

export interface VehiclePriceInput {
  brandName?: string;
  modelName?: string;
  bodyType?: string;
  manufactureYear?: string;
  registrationYear?: string;
  mileage?: string;
  color?: string;
  condition?: string;
  engineCapacity?: string;
  enginePower?: string;
  batteryCapacity?: string;
  rangePerCharge?: string;
  fuelType?: string;
  transmission?: string;
  origin?: string;
  documentsStatus?: string;
  seatCount?: string;
  doorCount?: string;
  wheelCount?: string;
  payloadKg?: string;
  grossWeightKg?: string;
  province?: string;
}

export interface VehiclePriceSuggestion {
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  confidence: number;
  reason: string;
  missingFields: string[];
  comparablesUsed: number;
}

const PRICE_PROMPT = `Bạn là chuyên gia định giá xe đã qua sử dụng tại Việt Nam.
Chỉ trả về JSON hợp lệ, không markdown, không giải thích ngoài JSON.
Hãy định giá theo VND dựa trên thông tin xe, khu vực bán và danh sách tin tương tự nếu có.
Trả giá theo khoảng minPrice - maxPrice, suggestedPrice là giá hợp lý để người bán đăng ban đầu.
Nếu thiếu dữ liệu quan trọng, vẫn ước lượng thận trọng và liệt kê missingFields.
Không trả giá âm, không dùng đơn vị trong số, làm tròn đến 100000 VND.
Schema: {"suggestedPrice":0,"minPrice":0,"maxPrice":0,"confidence":0,"reason":"","missingFields":[]}`;

const ANALYSIS_PROMPT = `Phân tích ảnh xe để tạo tin đăng marketplace xe cũ tại Việt Nam.
Chỉ trả về JSON hợp lệ, không markdown, không giải thích.
Chỉ suy luận các thông tin có thể thấy rõ từ ảnh. Nếu không chắc, để chuỗi rỗng hoặc dùng other cho enum.
Nếu ảnh không phải phương tiện, không liên quan đến xe, ảnh quá mờ, ảnh bị che khuất quá nhiều, ảnh lỗi, hoặc không đủ thông tin để xác định có xe thì trả isVehicle là false và rejectReason bằng tiếng Việt ngắn gọn.
Nếu có ít nhất một phương tiện hợp lệ và đủ rõ để đăng tin thì trả isVehicle là true và rejectReason là chuỗi rỗng.
Các field số vẫn trả về dạng chuỗi số, không kèm đơn vị.
Enum hợp lệ:
- bodyType: motorbike,motorcycle,scooter,car,truck,dump_truck,van,bus,special_purpose,other
- condition: new,used,excellent,good,fair
- fuelType: gasoline,diesel,electric,hybrid,plug_in_hybrid,other
- transmission: manual,automatic,semi_automatic,cvt,single_speed,other
Schema: {"isVehicle":true,"rejectReason":"","title":"","brandName":"","modelName":"","bodyType":"","manufactureYear":"","registrationYear":"","mileage":"","color":"","condition":"","fuelType":"","transmission":"","engineCapacity":"","enginePower":"","batteryCapacity":"","rangePerCharge":"","licensePlate":"","origin":"","documentsStatus":"","seatCount":"","doorCount":"","wheelCount":"","payloadKg":"","grossWeightKg":"","extraSpecs":{},"confidence":0,"notes":[]}`;

@Injectable()
export class GeminiVisionService {
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly rateLimiter: GeminiRateLimiterService,
  ) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.model =
      this.configService.get<string>('GEMINI_VISION_MODEL') ??
      'gemini-2.5-flash';
  }

  async analyzeImages(images: Express.Multer.File[]): Promise<{
    message: string;
    data: CarAnalysisResult;
    usage: ReturnType<GeminiRateLimiterService['getUsage']>;
  }> {
    if (!images.length) {
      throw new BadRequestException('Vui lòng tải lên ít nhất một hình ảnh');
    }

    if (!this.apiKey) {
      return {
        message: 'Phân tích ảnh bằng dữ liệu mẫu',
        data: this.getFallback(images),
        usage: this.rateLimiter.getUsage(),
      };
    }

    this.rateLimiter.checkAndConsume();
    const { GoogleGenAI } = await import('@google/genai');
    const client = new GoogleGenAI({ apiKey: this.apiKey });

    const imageParts = images.slice(0, 6).map((image) => ({
      inlineData: {
        mimeType: image.mimetype,
        data: image.buffer.toString('base64'),
      },
    }));

    const response = await client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [{ text: ANALYSIS_PROMPT }, ...imageParts],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text ?? '{}';

    try {
      const parsed = JSON.parse(text) as CarAnalysisResult;
      return {
        message: 'Gemini đã phân tích ảnh xe',
        data: this.sanitize(parsed),
        usage: this.rateLimiter.getUsage(),
      };
    } catch {
      return {
        message: 'Gemini trả về dữ liệu không đúng định dạng',
        data: this.getFallback(images),
        usage: this.rateLimiter.getUsage(),
      };
    }
  }

  async suggestVehiclePrice(
    input: VehiclePriceInput,
    comparables: PriceComparable[],
  ): Promise<{
    message: string;
    data: VehiclePriceSuggestion;
    usage: ReturnType<GeminiRateLimiterService['getUsage']>;
  }> {
    if (!this.apiKey) {
      throw new BadRequestException('Chưa cấu hình GEMINI_API_KEY');
    }

    this.rateLimiter.checkAndConsume();
    const { GoogleGenAI } = await import('@google/genai');
    const client = new GoogleGenAI({ apiKey: this.apiKey });
    const response = await client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${PRICE_PROMPT}\nThông tin xe:\n${JSON.stringify(input)}\nTin tương tự:\n${JSON.stringify(comparables)}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text ?? '{}';
    console.log(text);

    try {
      const parsed = JSON.parse(text) as Partial<VehiclePriceSuggestion>;
      return {
        message: 'AI đã gợi ý giá xe',
        data: this.sanitizePriceSuggestion(parsed, comparables.length),
        usage: this.rateLimiter.getUsage(),
      };
    } catch {
      throw new BadRequestException(
        'AI trả về dữ liệu định giá không đúng định dạng',
      );
    }
  }

  private sanitize(data: Partial<CarAnalysisResult>): CarAnalysisResult {
    const validBodyTypes = [
      'motorbike',
      'motorcycle',
      'scooter',
      'car',
      'truck',
      'dump_truck',
      'van',
      'bus',
      'special_purpose',
      'other',
    ];
    const validConditions = ['new', 'used', 'excellent', 'good', 'fair'];
    const validFuelTypes = [
      'gasoline',
      'diesel',
      'electric',
      'hybrid',
      'plug_in_hybrid',
      'other',
    ];
    const validTransmissions = [
      'manual',
      'automatic',
      'semi_automatic',
      'cvt',
      'single_speed',
      'other',
    ];

    return {
      isVehicle: data.isVehicle === true,
      rejectReason: data.rejectReason ?? '',
      title: data.title ?? '',
      brandName: data.brandName ?? '',
      modelName: data.modelName ?? '',
      bodyType: validBodyTypes.includes(data.bodyType ?? '')
        ? (data.bodyType ?? '')
        : 'other',
      manufactureYear: data.manufactureYear ?? '',
      registrationYear: data.registrationYear ?? '',
      mileage: data.mileage ?? '',
      color: data.color ?? '',
      condition: validConditions.includes(data.condition ?? '')
        ? (data.condition ?? '')
        : '',
      fuelType: validFuelTypes.includes(data.fuelType ?? '')
        ? (data.fuelType ?? '')
        : 'other',
      transmission: validTransmissions.includes(data.transmission ?? '')
        ? (data.transmission ?? '')
        : 'other',
      engineCapacity: data.engineCapacity ?? '',
      enginePower: data.enginePower ?? '',
      batteryCapacity: data.batteryCapacity ?? '',
      rangePerCharge: data.rangePerCharge ?? '',
      licensePlate: data.licensePlate ?? '',
      origin: data.origin ?? '',
      documentsStatus: data.documentsStatus ?? '',
      seatCount: data.seatCount ?? '',
      doorCount: data.doorCount ?? '',
      wheelCount: data.wheelCount ?? '',
      payloadKg: data.payloadKg ?? '',
      grossWeightKg: data.grossWeightKg ?? '',
      extraSpecs:
        data.extraSpecs && typeof data.extraSpecs === 'object'
          ? data.extraSpecs
          : {},
      confidence:
        typeof data.confidence === 'number'
          ? Math.min(1, Math.max(0, data.confidence))
          : 0,
      notes: Array.isArray(data.notes)
        ? data.notes.filter((n) => typeof n === 'string')
        : [],
    };
  }

  private sanitizePriceSuggestion(
    data: Partial<VehiclePriceSuggestion>,
    comparablesUsed: number,
  ): VehiclePriceSuggestion {
    const suggestedPrice = this.roundPrice(data.suggestedPrice);
    const minPrice = this.roundPrice(data.minPrice);
    const maxPrice = this.roundPrice(data.maxPrice);
    const normalizedMin = Math.min(
      minPrice || suggestedPrice,
      maxPrice || suggestedPrice,
    );
    const normalizedMax = Math.max(
      minPrice || suggestedPrice,
      maxPrice || suggestedPrice,
    );

    return {
      suggestedPrice,
      minPrice: normalizedMin,
      maxPrice: normalizedMax,
      confidence:
        typeof data.confidence === 'number'
          ? Math.min(1, Math.max(0, data.confidence))
          : 0,
      reason:
        data.reason || 'AI đã ước lượng giá dựa trên thông tin xe hiện có',
      missingFields: Array.isArray(data.missingFields)
        ? data.missingFields.filter((field) => typeof field === 'string')
        : [],
      comparablesUsed,
    };
  }

  private roundPrice(value?: number): number {
    const price = Number(value || 0);
    if (!Number.isFinite(price) || price <= 0) return 0;
    return Math.round(price / 100_000) * 100_000;
  }

  private getFallback(images: Express.Multer.File[]): CarAnalysisResult {
    return {
      isVehicle: false,
      rejectReason: 'Chưa phân tích được ảnh xe',
      title: '',
      brandName: '',
      modelName: '',
      bodyType: 'other',
      manufactureYear: '',
      registrationYear: '',
      mileage: '',
      color: '',
      condition: 'used',
      fuelType: 'gasoline',
      transmission: 'manual',
      engineCapacity: '',
      enginePower: '',
      batteryCapacity: '',
      rangePerCharge: '',
      licensePlate: '',
      origin: '',
      documentsStatus: '',
      seatCount: '',
      doorCount: '',
      wheelCount: '',
      payloadKg: '',
      grossWeightKg: '',
      extraSpecs: {},
      confidence: 0,
      notes: [`${images.length} ảnh đã tải lên nhưng chưa phân tích được`],
    };
  }
}
