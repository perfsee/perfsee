import { MigrationInterface, QueryRunner } from 'typeorm'

export class migrations1679302061626 implements MigrationInterface {
  name = 'migrations1679302061626'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` ADD \`react_profile_storage_key\` varchar(255) NULL`)
    await queryRunner.query(`ALTER TABLE \`profile\` ADD \`react_profiling\` tinyint NOT NULL DEFAULT 0`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profile\` DROP COLUMN \`react_profiling\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP COLUMN \`react_profile_storage_key\``)
  }
}
