import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { GraphQLErrorFilter } from './filter/gql-validation-error.filter';
import cookieParser from 'cookie-parser';

import { graphqlUploadExpress } from 'graphql-upload-ts';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    allowedHeaders: [
      'Accept',
      'Authorization',
      'Content-Type',
      'X-Requested-With',
      'apollo-require-preflight',
    ],
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  });
  
  app.use(graphqlUploadExpress({ maxFileSize: 10000000000, maxFiles: 10 }));
  app.use(cookieParser());


  //pipes here for data validations
  const validationPipeOptions = {
    whitelist: true,
    transform: true,
    exceptionFactory: (errors) => formatValidationErrors(errors),
  };

  //this is to use decoratos such as class-validatos
  app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
  app.useGlobalFilters(new GraphQLErrorFilter());
  await app.listen(3001);
}

function formatValidationErrors(errors) {
  const formattedErrors = errors.reduce((accumulator, error) => {
    const constraints = Object.values(error.constraints).join(', ');
    accumulator[error.property] = constraints;
    return accumulator;
  }, {});
  
  console.log('formattedErrors123', formattedErrors);
  throw new BadRequestException(formattedErrors);
}

bootstrap();
