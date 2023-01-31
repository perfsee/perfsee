import { Field, ID, ObjectType } from '@nestjs/graphql'
import { BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn, RelationId } from 'typeorm'
import { Project } from './project.entity'
import { User } from './user.entity'

@Entity()
@ObjectType()
export class Webhook extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Field(() => ID, { name: 'id' })
  @Index({ unique: true })
  @Column({ type: 'varchar' })
  uuid!: string

  @ManyToOne('Project', 'webhooks', { onDelete: 'CASCADE', nullable: true })
  project!: Project | null

  @RelationId('project')
  @Index()
  @Column({ nullable: true })
  projectId!: number | null

  @ManyToOne('User', 'webhooks', { onDelete: 'CASCADE', nullable: true })
  user!: User | null

  @RelationId('user')
  @Index()
  @Column({ nullable: true })
  userId!: number | null

  @Field(() => String, { description: 'the url will receive the webhook requests' })
  @Column({ type: 'varchar', length: 1024 })
  url!: string

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  secret!: string | null

  @Field(() => String)
  @Column({ type: 'varchar', default: 'POST' })
  method!: 'POST'

  @Field(() => String)
  @Column({ type: 'varchar', length: 1024 })
  eventType!: string
}
