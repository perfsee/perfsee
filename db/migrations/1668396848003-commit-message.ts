import { MigrationInterface, QueryRunner } from 'typeorm'

export class commitMessage1668396848003 implements MigrationInterface {
  name = 'commitMessage1668396848003'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`app_version\` ADD \`commit_message\` varchar(255) NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`app_version\` DROP COLUMN \`commit_message\``)
  }
}
