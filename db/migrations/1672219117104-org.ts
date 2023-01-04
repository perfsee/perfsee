import { MigrationInterface, QueryRunner } from 'typeorm'

export class org1672219117104 implements MigrationInterface {
  name = 'org1672219117104'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`idx_dc883ba3bc3a5f1842a1152e63\` ON \`user_permission_with_org\``)
    await queryRunner.query(`ALTER TABLE \`user_permission_with_org\` DROP COLUMN \`org_id\``)
    await queryRunner.query(
      `ALTER TABLE \`user_permission_with_org\` DROP FOREIGN KEY \`FK_0b0a358226325ede9b9952c94d9\``,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_permission_with_org\` CHANGE \`organization_id\` \`organization_id\` int NOT NULL`,
    )
    await queryRunner.query(
      `CREATE INDEX \`idx_0b0a358226325ede9b9952c94d\` ON \`user_permission_with_org\` (\`organization_id\`)`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_permission_with_org\` ADD CONSTRAINT \`FK_0b0a358226325ede9b9952c94d9\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organization\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_permission_with_org\` DROP FOREIGN KEY \`FK_0b0a358226325ede9b9952c94d9\``,
    )
    await queryRunner.query(`DROP INDEX \`idx_0b0a358226325ede9b9952c94d\` ON \`user_permission_with_org\``)
    await queryRunner.query(
      `ALTER TABLE \`user_permission_with_org\` CHANGE \`organization_id\` \`organization_id\` int NULL`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_permission_with_org\` ADD CONSTRAINT \`FK_0b0a358226325ede9b9952c94d9\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organization\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(`ALTER TABLE \`user_permission_with_org\` ADD \`org_id\` int NOT NULL`)
    await queryRunner.query(
      `CREATE INDEX \`idx_dc883ba3bc3a5f1842a1152e63\` ON \`user_permission_with_org\` (\`org_id\`)`,
    )
  }
}
