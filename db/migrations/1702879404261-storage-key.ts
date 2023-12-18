import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migrations1702879404261 implements MigrationInterface {
  name = 'Migrations1702879404261'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` ADD \`trace_data_storage_key\` varchar(255) NULL`)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` ADD \`requests_storage_key\` varchar(255) NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP COLUMN \`requests_storage_key\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP COLUMN \`trace_data_storage_key\``)
  }
}
