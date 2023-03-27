import { JobType } from '@perfsee/server-common'
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm'
import { Job } from './job.entity'

// entity used to store required information for accelerating job fetching
// record delete right after job is assigned to a runner
@Entity()
export class PendingJob extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number

  @RelationId('job')
  @Index()
  @Column({ type: 'int', nullable: false })
  jobId!: number

  @OneToOne(() => Job)
  @JoinColumn()
  job!: Job

  @Column({ type: 'varchar', length: 50 })
  jobType!: JobType

  @Column({ type: 'varchar', length: 50 })
  zone!: string

  @CreateDateColumn()
  createdAt!: Date

  static async createFromJob(job: Job) {
    return this.create({
      jobId: job.id,
      jobType: job.jobType,
      zone: job.zone,
    }).save()
  }
}
