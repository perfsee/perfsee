import { MigrationInterface, QueryRunner } from 'typeorm'

export class sourceStatistics1678088598916 implements MigrationInterface {
  name = 'sourceStatistics1678088598916'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD \`source_analyze_statistics_storage_key\` varchar(255) NULL`,
    )
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` ADD \`source_status\` tinyint NULL DEFAULT '0'`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP COLUMN \`source_status\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP COLUMN \`source_analyze_statistics_storage_key\``)
  }
}
