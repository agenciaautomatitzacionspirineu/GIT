CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NULL UNIQUE,
  display_name VARCHAR(80) NOT NULL,
  password_hash VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE games (
  id CHAR(36) PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  name VARCHAR(80) NOT NULL,
  era_id VARCHAR(40) NOT NULL DEFAULT 'prehistory',
  difficulty VARCHAR(24) NOT NULL,
  resource_mode VARCHAR(24) NOT NULL,
  objective_mode VARCHAR(24) NOT NULL,
  speed_multiplier SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  state_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT games_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE game_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  game_id CHAR(36) NOT NULL,
  event_type VARCHAR(60) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT game_events_game_fk FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  INDEX game_events_game_created_idx (game_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE game_action_queue (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  game_id CHAR(36) NOT NULL,
  group_key VARCHAR(120) NOT NULL,
  action_type VARCHAR(40) NOT NULL,
  target_id VARCHAR(80) NOT NULL,
  label VARCHAR(120) NOT NULL,
  workers SMALLINT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  total_seconds DECIMAL(12,3) NOT NULL,
  remaining_seconds DECIMAL(12,3) NOT NULL,
  payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT action_queue_game_fk FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  INDEX action_queue_group_idx (game_id, group_key, id),
  INDEX action_queue_status_idx (game_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE game_tile_config (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  game_id CHAR(36) NOT NULL,
  tile_index SMALLINT UNSIGNED NOT NULL,
  x SMALLINT UNSIGNED NOT NULL,
  y SMALLINT UNSIGNED NOT NULL,
  terrain_json JSON NOT NULL,
  special_tile_json JSON NULL,
  resource_mode VARCHAR(24) NOT NULL,
  reserve_amount DECIMAL(14,3) NULL,
  richness DECIMAL(6,3) NOT NULL DEFAULT 1,
  development_level SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  config_json JSON NULL,
  CONSTRAINT tile_config_game_fk FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  UNIQUE KEY tile_config_game_tile_unique (game_id, tile_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE game_rule_config (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  game_id CHAR(36) NULL,
  scope VARCHAR(60) NOT NULL,
  config_key VARCHAR(120) NOT NULL,
  config_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT rule_config_game_fk FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  UNIQUE KEY rule_config_scope_key_unique (game_id, scope, config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE content_versions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(32) NOT NULL UNIQUE,
  content_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
