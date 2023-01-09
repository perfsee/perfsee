import { MigrationInterface, QueryRunner } from 'typeorm'

export class commitMessage1673235793300 implements MigrationInterface {
  name = 'commitMessage1673235793300'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`app_version\` DROP COLUMN \`snapshot_id\``)
    await queryRunner.query(`ALTER TABLE \`app_version\` DROP COLUMN \`artifact_id\``)
    await queryRunner.query(`ALTER TABLE \`app_version\` ADD \`pr\` int NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`app_version\` DROP COLUMN \`pr\``)
    await queryRunner.query(`ALTER TABLE \`app_version\` ADD \`artifact_id\` int NULL`)
    await queryRunner.query(`ALTER TABLE \`app_version\` ADD \`snapshot_id\` int NULL`)
  }
}
