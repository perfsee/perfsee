import { MigrationInterface, QueryRunner } from 'typeorm'

export class foreignKeys1668670838492 implements MigrationInterface {
  name = 'foreignKeys1668670838492'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE \`job\`
            ADD CONSTRAINT \`FK_ca5fac3e39d6e93df14903d1072\` FOREIGN KEY (\`runner_id\`) REFERENCES \`runner\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE \`page_with_competitor\`
            ADD CONSTRAINT \`FK_b0f452aef10b0019e00eaa927e5\` FOREIGN KEY (\`competitor_id\`) REFERENCES \`page\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE \`source_issue\`
            ADD CONSTRAINT \`FK_4835a8bf4d0ae06e03541edfa89\` FOREIGN KEY (\`snapshot_report_id\`) REFERENCES \`snapshot_report\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE \`user_connected_account\`
            ADD CONSTRAINT \`FK_e956657dfdd875f5bc44c412c17\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE \`user_connected_account\` DROP FOREIGN KEY \`FK_e956657dfdd875f5bc44c412c17\`
        `)
    await queryRunner.query(`
            ALTER TABLE \`source_issue\` DROP FOREIGN KEY \`FK_4835a8bf4d0ae06e03541edfa89\`
        `)
    await queryRunner.query(`
            ALTER TABLE \`page_with_competitor\` DROP FOREIGN KEY \`FK_b0f452aef10b0019e00eaa927e5\`
        `)
    await queryRunner.query(`
            ALTER TABLE \`job\` DROP FOREIGN KEY \`FK_ca5fac3e39d6e93df14903d1072\`
        `)
  }
}
