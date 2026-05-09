<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class SeedSchema extends Command
{
    protected $signature = 'db:seed-schema';
    protected $description = 'Exécute le schéma SQL complet (01_schema.sql et 02_procedures.sql)';

    public function handle()
    {
        $this->info('Exécution du schéma SQL...');

        try {
            // L1 - Schema
            $schemaPath = base_path('../database/01_schema.sql');
            $schema = File::get($schemaPath);

            // Split by ;; (MySQL multi-statement separator) or ; for individual statements
            // But we need to be careful with DELIMITER statements
            $statements = preg_split('/;\s*\n/', $schema);

            foreach ($statements as $statement) {
                $statement = trim($statement);
                if (empty($statement)) continue;

                // Skip DELIMITER directives (they're for procedure handling)
                if (preg_match('/^DELIMITER\s+/i', $statement)) continue;

                try {
                    DB::unprepared($statement . ';');
                } catch (\Exception $e) {
                    // Log but continue for non-critical errors
                    $this->warn("Avertissement: " . $e->getMessage());
                }
            }
            $this->info('✓ Schéma (01_schema.sql) exécuté avec succès');

            // L2 - Procedures (avec gestion des DELIMITER)
            $proceduresPath = base_path('../database/02_procedures.sql');
            $content = File::get($proceduresPath);

            // Split procedures by $$ (end of procedure marker)
            // First, remove all DELIMITER directives
            $content = preg_replace('/DELIMITER\s+\$\$\s*\n/i', '', $content);
            $content = preg_replace('/DELIMITER\s+;/i', '', $content);

            // Split by $$ (procedure end marker)
            $procedures = preg_split('/\$\$\s*\n/', $content);

            foreach ($procedures as $procedure) {
                $procedure = trim($procedure);
                if (empty($procedure)) continue;

                // Remove trailing $$ if still present
                $procedure = rtrim($procedure, '$ ');

                // Ensure statement ends with semicolon
                if (!empty($procedure) && !str_ends_with($procedure, ';')) {
                    $procedure .= ';';
                }

                if (!empty($procedure)) {
                    DB::unprepared($procedure);
                }
            }

            $this->info('✓ Procédures (02_procedures.sql) exécutées avec succès');

            $this->info('✓ Tous les scripts SQL ont été exécutés avec succès !');
            return 0;
        } catch (\Exception $e) {
            $this->error('Erreur lors de l\'exécution : ' . $e->getMessage());
            return 1;
        }
    }
}
