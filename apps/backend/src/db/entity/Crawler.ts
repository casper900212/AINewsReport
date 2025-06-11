import { Column, Entity } from 'typeorm'
import Base from './Base'

@Entity('crawler')
export default class Crawler extends Base {
  @Column('varchar', { length: 100, unique: true })
  name!: string

  @Column({ name: 'script_filename' })
  scriptFilename!: string

  @Column('boolean', { default: true })
  enabled!: boolean

  @Column({ name: 'lase_run', type: 'timestamp', nullable: true })
  lastRun!: Date | null
}
