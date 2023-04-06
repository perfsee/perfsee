import { MigrationInterface, QueryRunner } from 'typeorm'

export class index1680591698409 implements MigrationInterface {
  name = 'index1680591698409'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX \`idx_1b0762808e62c1ea11ec1dde25\` ON \`artifact\` (\`iid\`)`)
    await queryRunner.query(`CREATE INDEX \`idx_9940b7529a36ddccf5c818e24e\` ON \`snapshot\` (\`iid\`)`)
    await queryRunner.query(`CREATE INDEX \`idx_6d3a030b112562ac4011f1836a\` ON \`snapshot_report\` (\`iid\`)`)
    await queryRunner.query(`CREATE INDEX \`idx_b13a0ed379b6a7d6e51cb3e3a8\` ON \`job\` (\`created_at\`)`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`idx_b13a0ed379b6a7d6e51cb3e3a8\` ON \`job\``)
    await queryRunner.query(`DROP INDEX \`idx_6d3a030b112562ac4011f1836a\` ON \`snapshot_report\``)
    await queryRunner.query(`DROP INDEX \`idx_9940b7529a36ddccf5c818e24e\` ON \`snapshot\``)
    await queryRunner.query(`DROP INDEX \`idx_1b0762808e62c1ea11ec1dde25\` ON \`artifact\``)
  }
}
