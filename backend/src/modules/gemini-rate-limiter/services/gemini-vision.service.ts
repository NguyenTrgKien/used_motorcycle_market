import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiRateLimiterService } from './gemini-rate-limiter.service';
import {
  LISTING_VEHICLE_FIELDS,
  ListingVehicleField,
} from '../../category/listing-form-schema';

export interface CarAnalysisResult {
  isVehicle: boolean;
  rejectReason: string;
  categorySlug: string;
  title: string;
  description: string;
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

export interface VehicleDescriptionResult {
  isVehicle: boolean;
  rejectReason: string;
  description: string;
  confidence: number;
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

const ANALYSIS_PROMPT = `Phân tích xe hoặc phụ kiện, phụ tùng xe từ hình ảnh để tạo tin đăng marketplace tại Việt Nam.
Chỉ trả về JSON hợp lệ, không markdown, không giải thích.
Chỉ suy luận các thông tin có thể thấy rõ từ ảnh. Nếu không chắc, để chuỗi rỗng hoặc dùng other cho enum.
Chấp nhận phương tiện và các phụ kiện, phụ tùng xe có thể nhận diện rõ như mũ bảo hiểm, camera hành trình, màn hình, lốp, mâm, đèn, gương, yên, thùng xe, ắc quy, bộ sạc, linh kiện động cơ và đồ chơi xe.
Nếu ảnh không có phương tiện, phụ kiện hoặc phụ tùng liên quan đến xe, ảnh quá mờ, bị che khuất quá nhiều, ảnh lỗi hoặc không đủ thông tin để nhận diện thì trả isVehicle là false và rejectReason bằng tiếng Việt ngắn gọn.
Nếu có ít nhất một phương tiện, phụ kiện hoặc phụ tùng xe hợp lệ và đủ rõ để đăng tin thì trả isVehicle là true và rejectReason là chuỗi rỗng.
Các field số vẫn trả về dạng chuỗi số, không kèm đơn vị.
Enum hợp lệ:
- bodyType: motorbike,motorcycle,scooter,car,truck,dump_truck,van,bus,special_purpose,other
- condition: new,used,excellent,good,fair
- fuelType: gasoline,diesel,electric,hybrid,plug_in_hybrid,other
- transmission: manual,automatic,semi_automatic,cvt,single_speed,other
Không viết mô tả tin đăng. Chỉ nhận diện các thuộc tính trong schema.
Tạo title ngắn gọn bằng tiếng Việt, phù hợp cho tin đăng. Với phương tiện, ưu tiên cấu trúc hãng xe + dòng xe + loại xe hoặc đặc điểm quan sát rõ được. Với phụ kiện hoặc phụ tùng, nêu đúng tên sản phẩm và đặc điểm có thể quan sát rõ. Không thêm năm sản xuất, phiên bản hoặc thông số nếu không thể xác nhận từ ảnh.
Schema: {"isVehicle":true,"rejectReason":"","categorySlug":"","title":"","brandName":"","modelName":"","bodyType":"","manufactureYear":"","registrationYear":"","mileage":"","color":"","condition":"","fuelType":"","transmission":"","engineCapacity":"","enginePower":"","batteryCapacity":"","rangePerCharge":"","licensePlate":"","origin":"","documentsStatus":"","seatCount":"","doorCount":"","wheelCount":"","payloadKg":"","grossWeightKg":"","extraSpecs":{},"confidence":0,"notes":[]}`;

const DESCRIPTION_PROMPT = `Phân tích ảnh để viết mô tả cho tin đăng xe, phụ kiện hoặc phụ tùng xe tại Việt Nam.
Chỉ trả về JSON hợp lệ, không markdown, không giải thích ngoài JSON.
Chấp nhận phương tiện và các phụ kiện, phụ tùng xe có thể nhận diện rõ như mũ bảo hiểm, camera hành trình, màn hình, lốp, mâm, đèn, gương, yên, thùng xe, ắc quy, bộ sạc, linh kiện động cơ và đồ chơi xe.
Nếu ảnh không có phương tiện, phụ kiện hoặc phụ tùng liên quan đến xe, ảnh quá mờ, bị che khuất quá nhiều hoặc không đủ rõ để nhận diện thì trả isVehicle là false và rejectReason bằng tiếng Việt ngắn gọn.
Nếu có ít nhất một phương tiện, phụ kiện hoặc phụ tùng xe hợp lệ thì trả isVehicle là true và rejectReason là chuỗi rỗng.
Viết description bằng tiếng Việt tự nhiên, chuyên nghiệp, hấp dẫn và dễ đọc, khoảng 100-150 từ.
Mở đầu bằng 1-2 câu giới thiệu thu hút nhưng không phóng đại.
Tiếp theo tạo mục "Điểm nổi bật:" gồm 3-5 dòng gạch đầu dòng. Mỗi dòng bắt đầu bằng "- " và nêu một đặc điểm riêng có thể quan sát rõ. Với xe, có thể mô tả ngoại hình, màu sắc, kiểu dáng, không gian hoặc tình trạng bề ngoài. Với phụ kiện hoặc phụ tùng, mô tả loại sản phẩm, màu sắc, chất liệu, thiết kế và tình trạng bề ngoài có thể quan sát được.
Kết thúc bằng một đoạn ngắn mời người mua liên hệ hoặc xem xe trực tiếp nhẹ nhàng, không tạo cảm giác thúc ép.
Dùng ký tự xuống dòng để tách phần mở đầu, danh sách và phần kết thúc. Không dùng emoji, không viết toàn bộ bằng chữ in hoa và không lặp ý.
Chỉ dùng thông tin quan sát được từ ảnh, không bịa giá bán, địa điểm, chủ sở hữu, lịch sử bảo dưỡng, giấy tờ, quãng đường, năm sản xuất, phiên bản hoặc tình trạng kỹ thuật không thể xác nhận.
Schema: {"isVehicle":true,"rejectReason":"","description":"","confidence":0}`;

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

  async analyzeImages(
    images: Express.Multer.File[],
    categories: Array<{
      slug: string;
      name: string;
      aiFields?: ListingVehicleField[];
    }> = [],
  ): Promise<{
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

    const categoryPrompt = categories.length
      ? `\nChọn chính xác một categorySlug từ danh sách sau dựa trên đối tượng chính trong ảnh. Không tự tạo slug mới. Sau khi chọn danh mục, chỉ phân tích các thuộc tính nằm trong aiFields của danh mục đó; mọi thuộc tính khác phải trả chuỗi rỗng. Nếu không thể xác định danh mục thì trả categorySlug là chuỗi rỗng.\nDanh mục và thuộc tính hợp lệ: ${JSON.stringify(categories)}`
      : '\nKhông có danh sách danh mục để đối chiếu, trả categorySlug là chuỗi rỗng.';

    const response = await client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${ANALYSIS_PROMPT}${categoryPrompt}` },
            ...imageParts,
          ],
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
        data: this.sanitize(parsed, categories),
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

  async generateDescription(images: Express.Multer.File[]): Promise<{
    message: string;
    data: VehicleDescriptionResult;
    usage: ReturnType<GeminiRateLimiterService['getUsage']>;
  }> {
    if (!images.length) {
      throw new BadRequestException('Vui lòng tải lên ít nhất một hình ảnh');
    }

    if (!this.apiKey) {
      return {
        message: 'Chưa thể tạo mô tả từ hình ảnh',
        data: {
          isVehicle: false,
          rejectReason: 'Chưa cấu hình GEMINI_API_KEY',
          description: '',
          confidence: 0,
        },
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
          parts: [{ text: DESCRIPTION_PROMPT }, ...imageParts],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    try {
      const parsed = JSON.parse(
        response.text ?? '{}',
      ) as Partial<VehicleDescriptionResult>;
      return {
        message: 'AI đã gợi ý mô tả tin đăng',
        data: {
          isVehicle: parsed.isVehicle === true,
          rejectReason: parsed.rejectReason?.trim() ?? '',
          description: parsed.description?.trim() ?? '',
          confidence:
            typeof parsed.confidence === 'number'
              ? Math.min(1, Math.max(0, parsed.confidence))
              : 0,
        },
        usage: this.rateLimiter.getUsage(),
      };
    } catch {
      throw new BadRequestException(
        'AI trả về dữ liệu mô tả không đúng định dạng',
      );
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

  private sanitize(
    data: Partial<CarAnalysisResult>,
    categories: Array<{
      slug: string;
      aiFields?: ListingVehicleField[];
    }> = [],
  ): CarAnalysisResult {
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
    const validCategorySlugs = categories.map((category) => category.slug);

    const sanitized: CarAnalysisResult = {
      isVehicle: data.isVehicle === true,
      rejectReason: data.rejectReason ?? '',
      categorySlug: validCategorySlugs.includes(data.categorySlug ?? '')
        ? (data.categorySlug ?? '')
        : '',
      title: data.title ?? '',
      description: data.description?.trim() ?? '',
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
    const selectedCategory = categories.find(
      (category) => category.slug === sanitized.categorySlug,
    );
    if (selectedCategory?.aiFields?.length) {
      LISTING_VEHICLE_FIELDS.forEach((field) => {
        if (!selectedCategory.aiFields?.includes(field)) {
          sanitized[field] = '';
        }
      });
    }
    return sanitized;
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
      categorySlug: '',
      rejectReason: 'Chưa phân tích được ảnh xe',
      title: '',
      description: '',
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
