import { MigrationInterface, QueryRunner } from 'typeorm'

export class applicationSettings1665220475798 implements MigrationInterface {
  name = 'applicationSettings1665220475798'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`application_setting\` ADD \`enable_signup\` tinyint NOT NULL DEFAULT 1`)
    await queryRunner.query(`ALTER TABLE \`application_setting\` ADD \`enable_oauth\` tinyint NOT NULL DEFAULT 0`)
    await queryRunner.query(
      `ALTER TABLE \`application_setting\` ADD \`enable_project_create\` tinyint NOT NULL DEFAULT 1`,
    )
    await queryRunner.query(
      `ALTER TABLE \`application_setting\` ADD \`enable_project_delete\` tinyint NOT NULL DEFAULT 1`,
    )
    await queryRunner.query(
      `ALTER TABLE \`application_setting\` ADD \`enable_project_import\` tinyint NOT NULL DEFAULT 0`,
    )
    await queryRunner.query(`ALTER TABLE \`application_setting\` ADD \`enable_email\` tinyint NOT NULL DEFAULT 0`)
    await queryRunner.query(
      `ALTER TABLE \`application_setting\` ADD \`user_email_confirmation\` tinyint NOT NULL DEFAULT 0`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`application_setting\` DROP COLUMN \`user_email_confirmation\``)
    await queryRunner.query(`ALTER TABLE \`application_setting\` DROP COLUMN \`enable_email\``)
    await queryRunner.query(`ALTER TABLE \`application_setting\` DROP COLUMN \`enable_project_import\``)
    await queryRunner.query(`ALTER TABLE \`application_setting\` DROP COLUMN \`enable_project_delete\``)
    await queryRunner.query(`ALTER TABLE \`application_setting\` DROP COLUMN \`enable_project_create\``)
    await queryRunner.query(`ALTER TABLE \`application_setting\` DROP COLUMN \`enable_oauth\``)
    await queryRunner.query(`ALTER TABLE \`application_setting\` DROP COLUMN \`enable_signup\``)
  }
}
