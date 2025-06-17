import { Column, Entity } from 'typeorm'
import Base from './Base'

@Entity('schedule')
export default class Schedule extends Base {
  @Column('varchar', { length: 100, unique: true })
  cron!: string
}
