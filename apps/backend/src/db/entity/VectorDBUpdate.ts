import { CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('vector_db_update')
export default class VectorDBUpdate {
  @PrimaryGeneratedColumn('increment', { type: 'integer' })
  id!: string

  @CreateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
