import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface CloudinaryResponse {
  url: string;
  publicId: string;
}

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadMultipleFile(files: Express.Multer.File[]) {
    const uploadPromise = files.map((file) => this.uploadSingleFile(file));
    return Promise.all(uploadPromise);
  }

  async uploadSingleFile(
    file: Express.Multer.File,
  ): Promise<CloudinaryResponse> {
    return new Promise((resolve, reject) => {
      if (!file || !(file instanceof Object) || !('buffer' in file)) {
        reject(new Error('File or file buffer is missing'));
        return;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: this.configService.get<string>('CLOUDINARY_UPLOAD_FOLDER'),
        },
        (error, result) => {
          if (error) {
            reject(new Error(error.message || 'Cloudinary upload failed'));
          } else {
            if (result?.secure_url) {
              resolve({
                url: result?.secure_url,
                publicId: result.public_id,
              });
            } else {
              reject(new Error('Không lấy được secure_url từ cloudinary'));
            }
          }
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      uploadStream.end(file.buffer);
    });
  }

  async deleteFiles(publicIds: string[]) {
    return Promise.all(
      publicIds.map(async (publicId) => await this.deleteFile(publicId)),
    );
  }

  async deleteFile(publicId: string) {
    return new Promise((resolve, reject) => {
      void cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          if (error instanceof Error) {
            return reject(new Error(error.message || 'Xóa hình ảnh thất bại'));
          }
        }
        resolve(result);
      });
    });
  }
}
