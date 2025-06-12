import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm'
  
  @Entity()
  export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id!: string
  
    @Column()
    title!: string
  
    @CreateDateColumn()
    createdAt!: Date
  
    @UpdateDateColumn()
    updatedAt!: Date
  }
  