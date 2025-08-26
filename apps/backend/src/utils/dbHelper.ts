/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/naming-convention */
import { dbConfig } from '../config'
import { DataSource } from 'typeorm'
import { Request, Response } from 'express'

export const appDataSource = new DataSource(dbConfig)

export const connectDatabase = async () => {
  if (!appDataSource.isInitialized) {
    await appDataSource.initialize()
  }
}

export const closeDatabase = () => {
  return async (_1: Request, _2: Response, next: Function) => {
    try {
      await appDataSource.destroy()
      next()
    } catch (err) {
      next(err)
    }
  }
}
