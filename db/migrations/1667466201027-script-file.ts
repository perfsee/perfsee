import { MigrationInterface, QueryRunner } from 'typeorm'

export class scriptFile1667466201027 implements MigrationInterface {
  name = 'scriptFile1667466201027'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`script_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`project_id\` int NOT NULL, \`file_name\` varchar(255) NOT NULL, \`from_artifact_id\` int NOT NULL, \`artifact_name\` varchar(255) NOT NULL, UNIQUE INDEX \`idx_4ab2865d99107c0fc1b97da866\` (\`project_id\`, \`file_name\`, \`artifact_name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`snapshot_report_with_artifact\` (\`id\` int NOT NULL AUTO_INCREMENT, \`snapshot_report_id\` int NOT NULL, \`artifact_id\` int NOT NULL, INDEX \`idx_10237fe278bbbe6d5c22867857\` (\`snapshot_report_id\`), INDEX \`idx_5eff5c82056bf06a6f1c335adf\` (\`artifact_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `ALTER TABLE \`setting\` ADD \`auto_detect_version\` tinyint NOT NULL COMMENT 'Whether to enable the experimental feature of automatic source association' DEFAULT 0`,
    )
    await queryRunner.query(
      `ALTER TABLE \`script_file\` ADD CONSTRAINT \`FK_949f2d365b7f3271a6509b5cf36\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`script_file\` ADD CONSTRAINT \`FK_0f4041fb2f4039fefde6e27f0be\` FOREIGN KEY (\`from_artifact_id\`) REFERENCES \`artifact\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report_with_artifact\` ADD CONSTRAINT \`FK_10237fe278bbbe6d5c228678577\` FOREIGN KEY (\`snapshot_report_id\`) REFERENCES \`snapshot_report\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report_with_artifact\` ADD CONSTRAINT \`FK_5eff5c82056bf06a6f1c335adf4\` FOREIGN KEY (\`artifact_id\`) REFERENCES \`artifact\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report_with_artifact\` DROP FOREIGN KEY \`FK_5eff5c82056bf06a6f1c335adf4\``,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report_with_artifact\` DROP FOREIGN KEY \`FK_10237fe278bbbe6d5c228678577\``,
    )
    await queryRunner.query(`ALTER TABLE \`script_file\` DROP FOREIGN KEY \`FK_0f4041fb2f4039fefde6e27f0be\``)
    await queryRunner.query(`ALTER TABLE \`script_file\` DROP FOREIGN KEY \`FK_949f2d365b7f3271a6509b5cf36\``)
    await queryRunner.query(`ALTER TABLE \`setting\` DROP COLUMN \`auto_detect_version\``)
    await queryRunner.query(`DROP INDEX \`idx_5eff5c82056bf06a6f1c335adf\` ON \`snapshot_report_with_artifact\``)
    await queryRunner.query(`DROP INDEX \`idx_10237fe278bbbe6d5c22867857\` ON \`snapshot_report_with_artifact\``)
    await queryRunner.query(`DROP TABLE \`snapshot_report_with_artifact\``)
    await queryRunner.query(`DROP INDEX \`idx_4ab2865d99107c0fc1b97da866\` ON \`script_file\``)
    await queryRunner.query(`DROP TABLE \`script_file\``)
  }
}
