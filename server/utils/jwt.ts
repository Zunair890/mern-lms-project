import dotenv from "dotenv"
import { IUser } from "../models/user.models"
import { redis } from "./redis"


interface ITokenOption {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none' | undefined;
    secure?: boolean;
  }

  // parse envirnrment variables to integrate with fallbacks
export const accessTokenExpires = parseInt(process.env.ACCESS_TOKEN_EXPIRE);
export const refreshTokenExpires = parseInt(process.env.REFRESH_TOKEN_EXPIRE);

// options for cookies
export const accessTokenOptions: ITokenOption = {
  expires: new Date(Date.now() + accessTokenExpires * 60 * 60 * 1000),
  maxAge: accessTokenExpires * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax'
};

export const refreshTokenOptions: ITokenOption = {
  expires: new Date(Date.now() + refreshTokenExpires * 60 * 1000),
  maxAge: refreshTokenExpires * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax'
};

  export const sendToken = (user: IUser, status: number, res: any) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    // upload session to redis
    redis.set(String(user._id), JSON.stringify(user));

    // only set secure to true in production

    if (process.env.NODE_ENV === 'production') {
      accessTokenOptions.secure = true;
    }
    res.cookie('access_token', accessToken, accessTokenOptions);
    res.cookie('refresh_token', refreshToken, refreshTokenOptions);
    res.status(status).json({
      status: 'success',
      user,
      accessToken
    });
  };