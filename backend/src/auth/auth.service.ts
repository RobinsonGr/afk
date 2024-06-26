//Badreqst (Itll throw 400 bad request) and Unauthexept(throwing 400 unauth) belong to nestjs's exeption filters
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {JwtService} from "@nestjs/jwt";
import { Response, Request } from 'express';

//I set this in the root of the config , in that way  it is possible to access to the enviroment variables in any partr
import { ConfigService } from '@nestjs/config';


@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService
    ) {}

    async refreshToken(req: Request, res: Response) : Promise<string> {
        //we start retreving the refreshToken, (the long-live one, they're the same, the onyl difference is it has more expiration time than the access token and less claims in the payload, it is for retrieve the access token when his time is up)
        const refreshToken = req.cookies['refresh_token'];


        if(!refreshToken) {
            //it will throw an 400 indicating wihtout auth/acess
            throw new UnauthorizedException('Refresh token wasnt found')
        };

        let payload;
        try {
            payload = this.jwtService.verify(refreshToken, {
                //I set this configService in the app's module, so i'm able to get the enviroment variables directly
                secret: this.configService.get<string>('REFRESH_TOKEN_SECRET')
            });
        } catch (err) {
            throw new UnauthorizedException('Refresh token wasnt found')
        }

        //after validating the refresh token, now it's required to retrieve the user, check and validate it
        const userExists = await this.prisma.person.findUnique({
            where: {id: payload.sub},
        });

        if(!userExists){
            throw new BadRequestException('user doesnt exist anymore')
        }

        const expiresIn = 20000; //those are seconds
        const expiration = Math.floor(Date.now() / 1000) + expiresIn;
        const accessToken = this.jwtService.sign(
            {...payload, exp: expiration},
            {
                secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
                expiresIn: '6d'
            }
        );

        //It's similar to using Express; NestJS simply has built-in objects for Response and Request, and it's the same when manipulating these HTTP objects to modify tokens and add headers
        req.cookies('access_token', accessToken, {httpOnly: true})

        return accessToken
    };
};


//signup
//signIn method name
//RETURN ALL METHODS WITH PROMISE FOR EXAMPLE {ACESS_TOKEN; string}