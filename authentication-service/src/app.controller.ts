import { BadRequestException, Body, Controller, Delete, Get, Logger, Param, Patch, Post, Put } from '@nestjs/common';

import { AppService } from './app.service';
import { Roles } from './decorators/role.decorator';
import { UserService } from './user/user.service';
import { CreateUserDto } from './dto/create.user.dto';
import { SessionService } from "./session/session.service";
import {LoginDto} from './dto/login.dto';
import { get } from 'http';
import { response } from 'express';
import { user } from '@nextui-org/react';

const bcrypt = require("bcrypt");



@Controller('auth')
export class AppController {
  constructor(private readonly appService: AppService, private readonly userService: UserService, private readonly sessionService: SessionService 
) { }
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }


  @Roles('admin', 'moderator')
  @Get('private-access')
  getAccessToSourcesWhichOnlyAdminModeratorCanAccess(): string {
    return this.appService.getHello();
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<any> {
    try {
      // Basic validation to ensure required fields are provided

      if (!createUserDto.email || !createUserDto.password) {
        throw new BadRequestException('email and password are required');
      }
      // Check if additional required fields are provided
      // Register user using the provided DTO
      const newUser = await this.userService.register(createUserDto);

      // Return successful response
      return { success: true, data: newUser };
    } catch (error) {
      // Handle any errors thrown during registration
      return { success: false, message: error.message || 'An error occurred during registration' };
    }
  }

  @Post('login')
  async login(@Body() user: any): Promise<any> {
   
      // Attempt to login user
      const getIdc= await this.userService.getUserbyEmail(user.email);
      const val = await this.sessionService.validateSession(getIdc.id);
      if(val){
        return { success: false, message: "Wrong Email or Password or User already logged in"  , response};
      }if(!val){
      try {
        const passwordMatch = await bcrypt.compare( user.password , getIdc.password);
      if (!passwordMatch) {
        return { success: false, message: "Wrong Email or Password"  };
      }

      Logger.log("user : " ,user)


      const response = await this.userService.login(user.email , user.password);



      const session = await this.sessionService.createSession(user.id, response.access_token);
      return { success: true, response , session };
      // Return response
    } catch (error) {
      // Handle any errors thrown during login
      return { success: false, message: error  }; // Return error response
    }
  }
  }
/*
  @Put('change-password')
  async changePassword(@Body() { userID, newPassword , oldPassword}: { userID: string, newPassword: string , oldPassword: string }): Promise<any> {
    try {
      // Attempt to change password
      const response = await this.userService.changePassword(userID, newPassword , oldPassword);
      return { success: true, response };
    } catch (error) {
      // Handle any errors thrown during password change
      return { success: false, message: error }; // Return error response
    }
  }

  */

  //////////////////////////////////////////
// it launches when the homepages is loaded
/////////////////////////////////////////////

  @Post('start-guest-session')
  async startGuestSession(): Promise<any> {
    try {
      // Attempt to start guest session
      const response = await this.sessionService.createGuestSession();
      return { success: true, response };
    } catch (error) {
      // Handle any errors thrown during guest session start
      return { success: false, message: error }; // Return error response
    }
  }

  //////////////////////////////////////////
  // is called when the user logs in 
  //////////////////////////////////////////

  @Post('update-session')
  async updateSession(@Body() { userID, guestID , access_token }: { userID: string, guestID: string , access_token : string }): Promise<any> {
    try {
      // Attempt to update session
      const response = await this.sessionService.updateSession(userID, guestID , access_token);
      return { success: true, response };
    } catch (error) {
      // Handle any errors thrown during session update
      return { success: false, message: error }; // Return error response
    }
  }


  @Delete('logout')
  async logout(@Body() user: any): Promise<any> {
    try {
      // Attempt to logout user
      //const response = await this.userService.logout(user);
      const session = await this.sessionService.deleteSession(user.userID);


      return { success: true, /*response , */session};
    } catch (error) {
      // Handle any errors thrown during logout
      return { success: false, message: error }; // Return error response
    }
  }

  

  @Get('/getUserbyID/:userId')
    async getUserbyID(@Param('userId') userId: string) {
      return await this.userService.getUserbyID(userId);
    }


    @Put('updatePassword')
    async updatePassword(@Body() { email, oldPassword ,newPassword }: { email: string, newPassword: string  , oldPassword : string}): Promise<any> {
      try {
        const user= await this.userService.getUserbyEmail(email);

        // Attempt to change password
        const passwordMatch = await bcrypt.compare(oldPassword , user.password);
        Logger.log("passwordMatch : " , passwordMatch);
        if (passwordMatch) {
          const response = await this.userService.updatePassword(email, newPassword);
          Logger.log("response : " , response);
          return { success: true, response , message : "Password updated successfully"};
        }
      } catch (error) {
        // Handle any errors thrown during password change
        return { success: false, message: error }; // Return error response
      }
    }

    @Put('forgetPassword')
    async forgetPassword(@Body() { email, otp , newPassword }: { email: string, otp: string , newPassword: string }): Promise<any> {
      try {
        // Attempt to change password
        const response = await this.userService.forgetPassword(email, otp , newPassword);
        return { success: true, response };
      } catch (error) {
        // Handle any errors thrown during password change
        return { success: false, message: error }; // Return error response
      }
    }

  

    @Post('sendPasswordResetEmail')
    async sendPasswordResetEmail(@Body() { email }: { email: string }): Promise<any> {
      try {
        // Attempt to send password reset email
        const response = await this.userService.sendPasswordResetEmail(email);
        return { success: true, response };
      } catch (error) {
        // Handle any errors thrown during password reset
        return { success: false, message: error }; // Return error response
      }
    }

    @Post('confirmOtp')
    async confirmOtp(@Body() { email, otp }: { email: string, otp: string }): Promise<any> {
      try {
        // Attempt to confirm OTP
        const response = await this.userService.confirmOtp(email, otp);
        return { success: true, response };
      } catch (error) {
        // Handle any errors thrown during OTP confirmation
        return { success: false, message: error }; // Return error response
      }
    }

    @Post('resendOtp')
    async resendOtp(@Body() { email }: { email: string }): Promise<any> {
      try {
        // Attempt to resend OTP
        const response = await this.userService.resendOtp(email);
        return { success: true, response };
      } catch (error) {
        // Handle any errors thrown during OTP resend
        return { success: false, message: error }; // Return error response
      }
    }

  




}
