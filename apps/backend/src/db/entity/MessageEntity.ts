import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
  } from 'typeorm'
  import { Conversation } from './ConversationEntity'
  
  @Entity()
  export class Message {
    @PrimaryGeneratedColumn('uuid')
    id!: string
  
    @Column()
    conversationId!: string
  
    @ManyToOne(() => Conversation)
    @JoinColumn({ name: 'conversationId' })
    conversation!: Conversation
  
    @Column()
    role!: 'user' | 'assistant'
  
    @Column('text')
    content!: string
  
    @CreateDateColumn()
    createdAt!: Date
  }
  