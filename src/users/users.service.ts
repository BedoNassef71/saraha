import { BadRequestException, Injectable } from '@nestjs/common';
import { SignUpUserDto } from './dto/sign-up-user.dto';
import { SignInUserDto } from './dto/sign-in-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import { UserResponse } from './dto/user.response';
import { plainIntoUserResponse } from '../common/helpers/plain-into-user.response';
import * as bcrypt from 'bcrypt';
import slugify from 'slugify';
import { UpdatePasswordDto } from '../profile/dto/update-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(signUpUserDto: SignUpUserDto): Promise<UserResponse> {
    const user = await this.userModel.create(signUpUserDto);
    return plainIntoUserResponse(user);
  }

  async verify(signInUserDto: SignInUserDto): Promise<UserResponse> {
    const user: User = await this.findByEmail(signInUserDto.email);
    const isSamePassword: boolean = user
      ? await this.comparePassword(signInUserDto.password, user.password)
      : false;
    if (!isSamePassword) {
      throw new BadRequestException(`email or password mismatch our records`);
    }
    return plainIntoUserResponse(user);
  }

  async findOne(id: string): Promise<User> {
    return this.userModel.findById(id);
  }

  async findUserBySlug(slug: string): Promise<User | undefined> {
    const user = await this.userModel.findOne({
      slug: slugify(slug, { lower: true, remove: /[*+~.()'"!:@]/g }),
    });
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email });
  }

  async changePassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    const user: any = await this.findOne(id);
    const isSamePassword: boolean = user
      ? await this.comparePassword(
          updatePasswordDto.currentPassword,
          user.password,
        )
      : false;
    if (!isSamePassword) {
      throw new BadRequestException(`email or password mismatch our records`);
    }
    user.password = updatePasswordDto.newPassword;
    await user.save();
  }

  private async comparePassword(
    candidatePassword: string,
    hashedPassword,
  ): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  async changeProfileImage(id: string, image: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { image }, { new: true });
  }

  async changeUsername(id: string, username: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { username }, { new: true });
  }
}
