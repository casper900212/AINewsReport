/* eslint-disable require-await */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/naming-convention */
import { logger } from './logger'
import { Request, Response } from 'express'
import { ValidateError } from 'tsoa'

export class AppError extends Error {
  constructor (message: any) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.message = message
    // logger.error(this.name + ': ' + this.message)
  }
}

export class ParamsError extends AppError {}
export class UnauthorizedError extends AppError {}
export class ForbiddenError extends AppError {}
export class NotFoundError extends AppError {}
export class DataExistError extends AppError {}
export class DatabaseError extends AppError {}
export class AwsError extends AppError {}
export class ApiCallError extends AppError {}

export const errorHandler = () => {
  return async (error: Error, _: Request, res: Response, next: Function): Promise<void> => {
    if (error) {
      let statusCode = 400
      let status = 'unknow'
      let message = 'unknow'

      if (error instanceof UnauthorizedError) {
        statusCode = 400
        status = error.name
        message = error.message
      } else if (error instanceof AppError) {
        statusCode = 400
        status = error.name
        message = error.message
      } else if (error instanceof ValidateError) {
        statusCode = error.status
        status = error.name
        message = ''

        for (const field in error.fields) {
          message += `${field}: [${error.fields[field].value}] ${error.fields[field].message}, `
        }

        if (message.length > 2) {
          message = message.slice(0, -2)
        }
      } else if (error instanceof Error) {
        console.log(error)
        statusCode = 500
        status = error.name
        message = error.message
        logger.error(JSON.stringify(error, null, 4))
      }

      res.status(statusCode).send({
        status,
        message,
      })
    } else {
      next()
    }
  }
}
