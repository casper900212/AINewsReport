import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import Base from './Base'
import Conversation from './ConversationEntity'

@Entity()
export class Message extends Base {
  @Column()
  conversationId!: number

  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation!: Conversation

  @Column()
  role!: 'user' | 'assistant' | 'human'

  @Column('text')
  content!: string
}
