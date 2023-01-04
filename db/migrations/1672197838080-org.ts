import { MigrationInterface, QueryRunner } from 'typeorm'

export class org1672197838080 implements MigrationInterface {
  name = 'org1672197838080'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`organization\` (\`id\` int NOT NULL AUTO_INCREMENT, \`slug\` varchar(100) NOT NULL, \`is_public\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`project_slugs\` text NOT NULL, UNIQUE INDEX \`idx_a08804baa7c5d5427067c49a31\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`user_permission_with_org\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`org_id\` int NOT NULL, \`permission\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`organization_id\` int NULL, INDEX \`idx_afae70553539c9c16673fd701b\` (\`user_id\`), INDEX \`idx_dc883ba3bc3a5f1842a1152e63\` (\`org_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_permission_with_org\` ADD CONSTRAINT \`FK_afae70553539c9c16673fd701b3\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_permission_with_org\` ADD CONSTRAINT \`FK_0b0a358226325ede9b9952c94d9\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organization\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_permission_with_org\` DROP FOREIGN KEY \`FK_0b0a358226325ede9b9952c94d9\``,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_permission_with_org\` DROP FOREIGN KEY \`FK_afae70553539c9c16673fd701b3\``,
    )
    await queryRunner.query(`DROP INDEX \`idx_dc883ba3bc3a5f1842a1152e63\` ON \`user_permission_with_org\``)
    await queryRunner.query(`DROP INDEX \`idx_afae70553539c9c16673fd701b\` ON \`user_permission_with_org\``)
    await queryRunner.query(`DROP TABLE \`user_permission_with_org\``)
    await queryRunner.query(`DROP INDEX \`idx_a08804baa7c5d5427067c49a31\` ON \`organization\``)
    await queryRunner.query(`DROP TABLE \`organization\``)
  }
}
