import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migrations1684310865774 implements MigrationInterface {
  name = 'Migrations1684310865774'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`package_bundle\` ADD \`iid\` int NOT NULL`)
    await queryRunner.query(`CREATE INDEX \`idx_87ce6174e3967c4b38f78b573c\` ON \`package_bundle\` (\`iid\`)`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`idx_87ce6174e3967c4b38f78b573c\` ON \`package_bundle\``)
    await queryRunner.query(`ALTER TABLE \`package_bundle\` DROP COLUMN \`iid\``)
  }
}
