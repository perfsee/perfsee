import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migrations1712654189560 implements MigrationInterface {
  name = 'Migrations1712654189560'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` ADD \`step_id\` int NULL COMMENT 'step id'`)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` ADD \`step_name\` varchar(255) NULL COMMENT 'step name'`)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` ADD \`step_of_id\` int NULL COMMENT 'step of report id'`)
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD CONSTRAINT \`FK_7870339af4106d2c55d12cb72ed\` FOREIGN KEY (\`step_of_id\`) REFERENCES \`snapshot_report\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP FOREIGN KEY \`FK_7870339af4106d2c55d12cb72ed\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP COLUMN \`step_of_id\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP COLUMN \`step_name\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP COLUMN \`step_id\``)
  }
}
