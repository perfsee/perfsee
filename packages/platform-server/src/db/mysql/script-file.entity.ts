import { BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn, RelationId } from 'typeorm'
import { Artifact } from './artifact.entity'
import { Project } from './project.entity'

@Entity()
@Index(['projectId', 'fileName', 'artifactName'], { unique: true })
export class ScriptFile extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column()
  @RelationId('project')
  projectId!: number

  @ManyToOne('Project', 'scriptFiles', { onDelete: 'CASCADE' })
  project!: Project

  @Column({ type: 'varchar', length: '255' })
  fileName!: string

  @Column()
  @RelationId('project')
  fromArtifactId!: number

  @ManyToOne('Artifact', 'scriptFiles')
  fromArtifact!: Artifact

  @Column({ type: 'varchar' })
  artifactName!: string
}
