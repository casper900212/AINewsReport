import {
  BaseEntity,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export default class Base extends BaseEntity {
  @PrimaryGeneratedColumn('increment', { type: 'integer' })
  id!: number

  @CreateDateColumn()
  created_at!: Date

  @UpdateDateColumn()
  updated_at!: Date

  @DeleteDateColumn()
  deleted_at!: Date | undefined

  public toResponseData () {
    const responseData: Base | any = Object.assign({}, this)
    delete responseData.updated_at
    delete responseData.deleted_at
    return responseData
  }
}
