import {
  Entity,
  Column,
} from 'typeorm'
import Base from './Base'

@Entity('conversation') 
export default class Conversation extends Base {

  @Column()
  title!: string

  @Column('jsonb', { nullable: true })
  filters?: {
    type: string;
    number: number;
    industry?: string[];
    keywords?: string[];
    source?: string[];
    dateRange?: string;
  }
}
