import { MigrationInterface, QueryRunner } from 'typeorm'

export class pendingJob1679543102110 implements MigrationInterface {
  name = 'pendingJob1679543102110'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE \`pending_job\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`job_id\` int NOT NULL,
                \`job_type\` varchar(50) NOT NULL,
                \`zone\` varchar(50) NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                INDEX \`idx_4e809fcfc3267ce1383af6bbbd\` (\`job_id\`),
                UNIQUE INDEX \`uniq_rel_4e809fcfc3267ce1383af6bbbd\` (\`job_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `)
    await queryRunner.query(`
            ALTER TABLE \`application_setting\`
            ADD \`use_pending_job_table\` tinyint NOT NULL DEFAULT 0
        `)
    await queryRunner.query(`
            ALTER TABLE \`pending_job\`
            ADD CONSTRAINT \`FK_4e809fcfc3267ce1383af6bbbd0\` FOREIGN KEY (\`job_id\`) REFERENCES \`job\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE \`pending_job\` DROP FOREIGN KEY \`FK_4e809fcfc3267ce1383af6bbbd0\`
        `)
    await queryRunner.query(`
            ALTER TABLE \`application_setting\` DROP COLUMN \`use_pending_job_table\`
        `)
    await queryRunner.query(`
            DROP INDEX \`uniq_rel_4e809fcfc3267ce1383af6bbbd\` ON \`pending_job\`
        `)
    await queryRunner.query(`
            DROP INDEX \`idx_4e809fcfc3267ce1383af6bbbd\` ON \`pending_job\`
        `)
    await queryRunner.query(`
            DROP TABLE \`pending_job\`
        `)
  }
}
