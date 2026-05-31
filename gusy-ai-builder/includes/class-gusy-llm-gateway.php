<?php
/**
 * LLM gateway service.
 *
 * @package Gusy_AI_Builder
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Stores LLM settings and calls current model endpoints or the local Codex CLI.
 */
final class Gusy_AI_Builder_LLM_Gateway {
	private const OPTION = 'gusy_llm_gateway_settings';

	/**
	 * Public settings safe for the admin app.
	 *
	 * @return array<string,mixed>
	 */
	public function get_public_settings(): array {
		$settings = $this->get_settings();
		$api_key  = (string) ( $settings['apiKey'] ?? '' );

		unset( $settings['apiKey'] );

		$settings['hasApiKey']    = '' !== $api_key;
		$settings['apiKeyPreview'] = '' !== $api_key ? '****' . substr( $api_key, -4 ) : '';
		$settings['configured']   = $this->settings_are_configured( $this->get_settings() );

		return $settings;
	}

	/**
	 * Raw stored settings.
	 *
	 * @return array<string,mixed>
	 */
	public function get_settings(): array {
		$saved = get_option( self::OPTION, array() );

		return $this->normalize_settings( is_array( $saved ) ? $saved : array(), array(), true );
	}

	/**
	 * Save settings from REST input.
	 *
	 * @param array<string,mixed> $input Raw input.
	 * @return array<string,mixed>
	 */
	public function save_settings( array $input ): array {
		$settings = $this->normalize_settings( $input, $this->get_settings(), true );

		update_option( self::OPTION, $settings, false );

		return $this->get_public_settings();
	}

	/**
	 * Check whether a usable endpoint is configured.
	 */
	public function is_configured(): bool {
		return $this->settings_are_configured( $this->get_settings() );
	}

	/**
	 * Source metadata for responses.
	 *
	 * @return array<string,string>
	 */
	public function source(): array {
		$settings = $this->get_settings();

		return array(
			'type'     => 'llm-gateway',
			'provider' => (string) $settings['provider'],
			'model'    => (string) $settings['model'],
		);
	}

	/**
	 * Test current or draft settings.
	 *
	 * @param array<string,mixed> $overrides Unsaved settings from the admin app.
	 * @return array<string,mixed>|WP_Error
	 */
	public function test_connection( array $overrides = array() ) {
		$settings = $this->normalize_settings( $overrides, $this->get_settings(), false );

		if ( ! $this->settings_are_configured( $settings ) ) {
			return new WP_Error( 'gusy_llm_not_configured', __( 'LLM gateway is not configured.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		$response = $this->complete_json_with_settings(
			$settings,
			array(
				array(
					'role'    => 'system',
					'content' => 'Return JSON only.',
				),
				array(
					'role'    => 'user',
					'content' => 'Return {"ok":true,"message":"ready"} as JSON.',
				),
			),
			300
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return array(
			'ok'       => ! empty( $response['ok'] ),
			'message'  => sanitize_text_field( (string) ( $response['message'] ?? 'ready' ) ),
			'provider' => (string) $settings['provider'],
			'model'    => (string) $settings['model'],
		);
	}

	/**
	 * Ask the model for JSON using stored settings.
	 *
	 * @param string              $system System instruction.
	 * @param string              $user User instruction.
	 * @param array<string,mixed> $shape Expected JSON shape example.
	 * @param int                 $max_tokens Max output tokens.
	 * @return array<string,mixed>|WP_Error
	 */
	public function complete_json( string $system, string $user, array $shape, int $max_tokens = 3200 ) {
		$settings = $this->get_settings();

		if ( ! $this->settings_are_configured( $settings ) ) {
			return new WP_Error( 'gusy_llm_not_configured', __( 'LLM gateway is not configured.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		$schema_hint = wp_json_encode( $shape, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES );
		$messages    = array(
			array(
				'role'    => 'system',
				'content' => trim( $system . "\nReturn strict JSON only. Do not wrap it in markdown." ),
			),
			array(
				'role'    => 'user',
				'content' => trim( $user . "\n\nExpected JSON shape:\n" . ( is_string( $schema_hint ) ? $schema_hint : '{}' ) ),
			),
		);

		return $this->complete_json_with_settings( $settings, $messages, $max_tokens );
	}

	/**
	 * Normalize settings.
	 *
	 * @param array<string,mixed> $input Raw settings.
	 * @param array<string,mixed> $existing Existing settings.
	 * @param bool                $persisting Whether the result will be saved.
	 * @return array<string,mixed>
	 */
	private function normalize_settings( array $input, array $existing = array(), bool $persisting = false ): array {
		$defaults = array(
			'enabled'  => false,
			'provider' => 'openai',
			'baseUrl'  => 'https://api.openai.com/v1',
			'model'    => 'gpt-5.5',
			'apiKey'   => '',
			'timeout'  => 45,
		);

		$settings = wp_parse_args( $existing, $defaults );

		if ( array_key_exists( 'enabled', $input ) ) {
			$settings['enabled'] = (bool) $input['enabled'];
		}

		if ( isset( $input['provider'] ) ) {
			$provider = sanitize_key( (string) $input['provider'] );
			$settings['provider'] = in_array( $provider, array( 'openai', 'anthropic', 'gemini', 'openai-compatible', 'gateway', 'codex' ), true ) ? $provider : 'openai';
		}

		$provider_defaults = $this->provider_defaults( (string) $settings['provider'] );

		if ( isset( $input['baseUrl'] ) ) {
			$base_url = trim( (string) $input['baseUrl'] );
			$settings['baseUrl'] = '' !== $base_url
				? $this->sanitize_base_url_or_codex_path( $base_url, (string) $settings['provider'] )
				: $provider_defaults['baseUrl'];
		}

		if ( empty( $settings['baseUrl'] ) ) {
			$settings['baseUrl'] = $provider_defaults['baseUrl'];
		}

		if ( isset( $input['model'] ) ) {
			$model = trim( sanitize_text_field( (string) $input['model'] ) );
			$settings['model'] = '' !== $model ? substr( $model, 0, 120 ) : $provider_defaults['model'];
		}

		if ( empty( $settings['model'] ) ) {
			$settings['model'] = $provider_defaults['model'];
		}

		if ( array_key_exists( 'apiKey', $input ) ) {
			$api_key = substr( preg_replace( '/[\r\n\t]/', '', trim( (string) $input['apiKey'] ) ), 0, 4096 );
			if ( '' !== $api_key ) {
				$settings['apiKey'] = $api_key;
			} elseif ( $persisting && ! empty( $input['clearApiKey'] ) ) {
				$settings['apiKey'] = '';
			}
		}

		if ( 'codex' === $settings['provider'] ) {
			$settings['apiKey'] = '';
		}

		if ( isset( $input['timeout'] ) ) {
			$settings['timeout'] = max( 10, min( 120, absint( $input['timeout'] ) ) );
		}

		return array(
			'enabled'  => (bool) $settings['enabled'],
			'provider' => (string) $settings['provider'],
			'baseUrl'  => (string) $settings['baseUrl'],
			'model'    => (string) $settings['model'],
			'apiKey'   => (string) $settings['apiKey'],
			'timeout'  => (int) $settings['timeout'],
		);
	}

	/**
	 * Default endpoint and model for each provider.
	 *
	 * @return array{baseUrl:string,model:string}
	 */
	private function provider_defaults( string $provider ): array {
		if ( 'codex' === $provider ) {
			return array(
				'baseUrl' => $this->find_codex_binary(),
				'model'   => 'gpt-5.5',
				);
			}

			if ( 'anthropic' === $provider ) {
				return array(
				'baseUrl' => 'https://api.anthropic.com/v1',
				'model'   => 'claude-opus-4-1-20250805',
			);
		}

		if ( 'gemini' === $provider ) {
			return array(
				'baseUrl' => 'https://generativelanguage.googleapis.com/v1beta',
				'model'   => 'gemini-2.5-pro',
			);
		}

		if ( 'gateway' === $provider ) {
			return array(
				'baseUrl' => 'https://openrouter.ai/api/v1',
				'model'   => 'openai/gpt-5.5',
			);
		}

		if ( 'openai-compatible' === $provider ) {
			return array(
				'baseUrl' => 'https://api.openai.com/v1',
				'model'   => 'gpt-5.5',
			);
		}

		return array(
			'baseUrl' => 'https://api.openai.com/v1',
			'model'   => 'gpt-5.5',
		);
	}

	/**
	 * Sanitize either a remote endpoint or a local Codex command path.
	 */
	private function sanitize_base_url_or_codex_path( string $value, string $provider ): string {
		if ( 'codex' === $provider ) {
			$value = preg_replace( '/[\r\n\t\0]/', '', trim( $value ) );

			return '' !== $value ? sanitize_text_field( $value ) : $this->find_codex_binary();
		}

		return $this->sanitize_remote_base_url( $value );
	}

	/**
	 * Sanitize an HTTPS model endpoint and block obvious private-network targets by default.
	 */
	private function sanitize_remote_base_url( string $value ): string {
		$url = esc_url_raw( untrailingslashit( trim( $value ) ) );
		if ( '' === $url || ! function_exists( 'wp_parse_url' ) ) {
			return '';
		}

		$parts  = wp_parse_url( $url );
		$scheme = is_array( $parts ) ? strtolower( (string) ( $parts['scheme'] ?? '' ) ) : '';
		$host   = is_array( $parts ) ? strtolower( (string) ( $parts['host'] ?? '' ) ) : '';
		$allow_private = defined( 'GUSY_ALLOW_PRIVATE_LLM_ENDPOINTS' ) && GUSY_ALLOW_PRIVATE_LLM_ENDPOINTS;
		if ( '' === $host || ( 'https' !== $scheme && ! ( $allow_private && 'http' === $scheme ) ) ) {
			return '';
		}

		if ( $this->is_private_endpoint_host( $host ) && ! $allow_private ) {
			return '';
		}

		return $url;
	}

	/**
	 * Identify local/private host names and literal IPs without doing DNS lookups.
	 */
	private function is_private_endpoint_host( string $host ): bool {
		$host = trim( $host, '[]' );
		if ( in_array( $host, array( 'localhost', 'localhost.localdomain' ), true ) ) {
			return true;
		}

		if ( filter_var( $host, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) {
			return ! filter_var( $host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE );
		}

		if ( filter_var( $host, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 ) ) {
			return ! filter_var( $host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE );
		}

		return false;
	}

	/**
	 * Resolve the most likely Codex CLI binary.
	 */
	private function find_codex_binary(): string {
		$candidates = array(
			'/Applications/Codex.app/Contents/Resources/codex',
			'/opt/homebrew/bin/codex',
			'/usr/local/bin/codex',
			'/usr/bin/codex',
		);

		foreach ( $candidates as $candidate ) {
			if ( is_executable( $candidate ) ) {
				return $candidate;
			}
		}

		return 'codex';
	}

	/**
	 * Whether the configured Codex command looks runnable.
	 */
	private function codex_binary_is_available( string $binary ): bool {
		$binary = trim( $binary );
		if ( '' === $binary ) {
			return false;
		}

		if ( str_contains( $binary, '/' ) || str_contains( $binary, '\\' ) ) {
			return is_file( $binary ) && is_executable( $binary );
		}

		return true;
	}

	/**
	 * Whether settings can make requests.
	 *
	 * @param array<string,mixed> $settings Settings.
	 */
		private function settings_are_configured( array $settings ): bool {
			if ( 'codex' === (string) ( $settings['provider'] ?? '' ) ) {
				return ! empty( $settings['enabled'] )
					&& ! empty( $settings['model'] )
					&& ! empty( $settings['baseUrl'] )
					&& function_exists( 'proc_open' )
					&& $this->codex_binary_is_available( (string) $settings['baseUrl'] );
			}

			return ! empty( $settings['enabled'] )
				&& ! empty( $settings['apiKey'] )
				&& ! empty( $settings['baseUrl'] )
			&& ! empty( $settings['model'] );
	}

	/**
	 * Execute OpenAI or OpenAI-compatible request.
	 *
	 * @param array<string,mixed>      $settings Settings.
	 * @param array<int,array<string,string>> $messages Messages.
	 * @param int                      $max_tokens Max tokens.
	 * @return array<string,mixed>|WP_Error
	 */
	private function complete_json_with_settings( array $settings, array $messages, int $max_tokens ) {
		if ( 'codex' === $settings['provider'] ) {
			return $this->complete_json_with_codex_cli( $settings, $messages );
		}
			if ( 'openai' === $settings['provider'] ) {
				return $this->complete_json_with_openai_responses( $settings, $messages, $max_tokens );
		}
		if ( 'anthropic' === $settings['provider'] ) {
			return $this->complete_json_with_anthropic( $settings, $messages, $max_tokens );
		}
		if ( 'gemini' === $settings['provider'] ) {
			return $this->complete_json_with_gemini( $settings, $messages, $max_tokens );
		}

		$body = array(
			'model'           => (string) $settings['model'],
			'messages'        => $messages,
			'temperature'     => 0.35,
			'max_tokens'      => $max_tokens,
			'response_format' => array(
				'type' => 'json_object',
			),
		);

		$response = $this->post_chat_completion( $settings, $body );

		if ( is_wp_error( $response ) && 'gusy_llm_http_400' === $response->get_error_code() ) {
			unset( $body['response_format'] );
			$response = $this->post_chat_completion( $settings, $body );
		}

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$content = (string) ( $response['choices'][0]['message']['content'] ?? '' );
		$json    = $this->extract_json( $content );

		if ( ! is_array( $json ) ) {
			return new WP_Error( 'gusy_llm_json_invalid', __( 'LLM returned invalid JSON.', 'gusy-ai-builder' ), array( 'status' => 502 ) );
		}

		return $json;
	}

	/**
	 * Execute the local OpenAI Codex CLI using the user's existing Codex login.
	 *
	 * @param array<string,mixed>      $settings Settings.
	 * @param array<int,array<string,string>> $messages Messages.
	 * @return array<string,mixed>|WP_Error
	 */
	private function complete_json_with_codex_cli( array $settings, array $messages ) {
		if ( ! function_exists( 'proc_open' ) ) {
			return new WP_Error( 'gusy_codex_proc_unavailable', __( 'Codex requires proc_open to be enabled on this WordPress host.', 'gusy-ai-builder' ), array( 'status' => 500 ) );
		}

		$binary = trim( (string) $settings['baseUrl'] );
		if ( ! $this->codex_binary_is_available( $binary ) ) {
			return new WP_Error( 'gusy_codex_missing', __( 'Codex CLI was not found. Install Codex or set the Codex path.', 'gusy-ai-builder' ), array( 'status' => 400 ) );
		}

		$output_file = tempnam( get_temp_dir(), 'gusy-codex-' );
		if ( ! is_string( $output_file ) || '' === $output_file ) {
			return new WP_Error( 'gusy_codex_temp_file', __( 'Could not create a temporary Codex output file.', 'gusy-ai-builder' ), array( 'status' => 500 ) );
		}

		$command = array(
			$binary,
			'exec',
			'--ignore-user-config',
			'--model',
			(string) $settings['model'],
			'--sandbox',
			'read-only',
			'--skip-git-repo-check',
			'--ephemeral',
			'--color',
			'never',
			'--output-last-message',
			$output_file,
			'-',
		);

		$result = $this->run_codex_cli( $command, $this->build_codex_prompt( $messages ), (int) $settings['timeout'] );
		$text   = is_readable( $output_file ) ? (string) file_get_contents( $output_file ) : '';
		@unlink( $output_file );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( '' === trim( $text ) ) {
			$text = (string) $result['stdout'];
		}

		$json = $this->extract_json( $text );

		if ( ! is_array( $json ) ) {
			return new WP_Error( 'gusy_codex_json_invalid', __( 'Codex returned invalid JSON.', 'gusy-ai-builder' ), array( 'status' => 502 ) );
		}

		return $json;
	}

	/**
	 * Execute OpenAI Responses API request.
	 *
	 * @param array<string,mixed>      $settings Settings.
	 * @param array<int,array<string,string>> $messages Messages.
	 * @param int                      $max_tokens Max tokens.
	 * @return array<string,mixed>|WP_Error
	 */
	private function complete_json_with_openai_responses( array $settings, array $messages, int $max_tokens ) {
		$body = array(
			'model'             => (string) $settings['model'],
			'input'             => $messages,
			'max_output_tokens' => $max_tokens,
			'text'              => array(
				'format'    => array(
					'type' => 'json_object',
				),
				'verbosity' => 'low',
			),
		);

		if ( str_starts_with( (string) $settings['model'], 'gpt-5' ) ) {
			$body['reasoning'] = array(
				'effort' => 'none',
			);
		}

		$response = $this->post_responses( $settings, $body );

		if ( is_wp_error( $response ) && str_contains( strtolower( $response->get_error_message() ), 'text' ) ) {
			unset( $body['text'] );
			$response = $this->post_responses( $settings, $body );
		}

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$json = $this->extract_json( $this->extract_responses_text( $response ) );

		if ( ! is_array( $json ) ) {
			return new WP_Error( 'gusy_llm_json_invalid', __( 'LLM returned invalid JSON.', 'gusy-ai-builder' ), array( 'status' => 502 ) );
		}

		return $json;
	}

	/**
	 * Execute Anthropic Messages API request.
	 *
	 * @param array<string,mixed>      $settings Settings.
	 * @param array<int,array<string,string>> $messages Messages.
	 * @param int                      $max_tokens Max tokens.
	 * @return array<string,mixed>|WP_Error
	 */
	private function complete_json_with_anthropic( array $settings, array $messages, int $max_tokens ) {
		$parts = $this->split_messages( $messages );
		$body  = array(
			'model'      => (string) $settings['model'],
			'max_tokens' => $max_tokens,
			'system'     => $parts['system'],
			'messages'   => array(
				array(
					'role'    => 'user',
					'content' => $parts['user'],
				),
			),
		);

		$response = $this->post_anthropic_messages( $settings, $body );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$json = $this->extract_json( $this->extract_anthropic_text( $response ) );
		if ( ! is_array( $json ) ) {
			return new WP_Error( 'gusy_llm_json_invalid', __( 'LLM returned invalid JSON.', 'gusy-ai-builder' ), array( 'status' => 502 ) );
		}

		return $json;
	}

	/**
	 * Execute Google Gemini generateContent request.
	 *
	 * @param array<string,mixed>      $settings Settings.
	 * @param array<int,array<string,string>> $messages Messages.
	 * @param int                      $max_tokens Max tokens.
	 * @return array<string,mixed>|WP_Error
	 */
	private function complete_json_with_gemini( array $settings, array $messages, int $max_tokens ) {
		$parts = $this->split_messages( $messages );
		$body  = array(
			'systemInstruction' => array(
				'parts' => array(
					array( 'text' => $parts['system'] ),
				),
			),
			'contents'          => array(
				array(
					'role'  => 'user',
					'parts' => array(
						array( 'text' => $parts['user'] ),
					),
				),
			),
			'generationConfig'  => array(
				'temperature'        => 0.35,
				'maxOutputTokens'    => $max_tokens,
				'responseMimeType'   => 'application/json',
			),
		);

		$response = $this->post_gemini_generate_content( $settings, $body );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$json = $this->extract_json( $this->extract_gemini_text( $response ) );
		if ( ! is_array( $json ) ) {
			return new WP_Error( 'gusy_llm_json_invalid', __( 'LLM returned invalid JSON.', 'gusy-ai-builder' ), array( 'status' => 502 ) );
		}

		return $json;
	}

	/**
	 * Build a compact prompt for non-interactive Codex JSON calls.
	 *
	 * @param array<int,array<string,string>> $messages Messages.
	 */
	private function build_codex_prompt( array $messages ): string {
		$parts = array(
			'You are the LLM engine for Gusy, a WordPress visual builder.',
			'Return strict JSON only. No markdown, no explanation, no extra text.',
		);

		foreach ( $messages as $message ) {
			$role    = strtoupper( sanitize_key( (string) ( $message['role'] ?? 'user' ) ) );
			$content = trim( (string) ( $message['content'] ?? '' ) );

			if ( '' !== $content ) {
				$parts[] = $role . ":\n" . $content;
			}
		}

		return implode( "\n\n", $parts );
	}

	/**
	 * Run Codex and capture the final response file while draining process output.
	 *
	 * @param array<int,string> $command Command argv.
	 * @param string            $stdin Prompt to send on stdin.
	 * @param int               $timeout Timeout in seconds.
	 * @return array{stdout:string,stderr:string,exitCode:int}|WP_Error
	 */
	private function run_codex_cli( array $command, string $stdin, int $timeout ) {
		$descriptors = array(
			0 => array( 'pipe', 'r' ),
			1 => array( 'pipe', 'w' ),
			2 => array( 'pipe', 'w' ),
		);
		$cwd         = defined( 'ABSPATH' ) && is_dir( ABSPATH ) ? ABSPATH : GUSY_AI_BUILDER_PATH;
		$process     = @proc_open( $command, $descriptors, $pipes, $cwd );

		if ( ! is_resource( $process ) ) {
			return new WP_Error( 'gusy_codex_start_failed', __( 'Could not start the Codex CLI.', 'gusy-ai-builder' ), array( 'status' => 500 ) );
		}

		fwrite( $pipes[0], $stdin );
		fclose( $pipes[0] );
		stream_set_blocking( $pipes[1], false );
		stream_set_blocking( $pipes[2], false );

		$stdout    = '';
		$stderr    = '';
		$deadline  = microtime( true ) + max( 10, min( 180, $timeout ) );
		$exit_code = null;

		while ( true ) {
			$stdout .= (string) stream_get_contents( $pipes[1] );
			$stderr .= (string) stream_get_contents( $pipes[2] );
			$status  = proc_get_status( $process );

			if ( empty( $status['running'] ) ) {
				$exit_code = isset( $status['exitcode'] ) ? (int) $status['exitcode'] : null;
				break;
			}

			if ( microtime( true ) >= $deadline ) {
				proc_terminate( $process );
				$stdout .= (string) stream_get_contents( $pipes[1] );
				$stderr .= (string) stream_get_contents( $pipes[2] );
				fclose( $pipes[1] );
				fclose( $pipes[2] );
				proc_close( $process );

				return new WP_Error( 'gusy_codex_timeout', __( 'Codex did not answer before the timeout.', 'gusy-ai-builder' ), array( 'status' => 504 ) );
			}

			usleep( 100000 );
		}

		$stdout .= (string) stream_get_contents( $pipes[1] );
		$stderr .= (string) stream_get_contents( $pipes[2] );
		fclose( $pipes[1] );
		fclose( $pipes[2] );
		$close_code = proc_close( $process );
		$exit_code  = null === $exit_code || -1 === $exit_code ? (int) $close_code : $exit_code;

		if ( 0 !== $exit_code ) {
			return new WP_Error(
				'gusy_codex_failed',
				$this->codex_error_message( $stdout, $stderr ),
				array( 'status' => 502 )
			);
		}

		return array(
			'stdout'   => $stdout,
			'stderr'   => $stderr,
			'exitCode' => $exit_code,
		);
	}

	/**
	 * Convert noisy CLI output into a useful admin error.
	 */
	private function codex_error_message( string $stdout, string $stderr ): string {
		$raw   = trim( $stderr . "\n" . $stdout );
		$lower = strtolower( $raw );

		if ( str_contains( $lower, 'login' ) || str_contains( $lower, 'auth' ) || str_contains( $lower, 'unauthorized' ) ) {
			return __( 'Codex is not logged in for this system user. Run codex login once, then test again.', 'gusy-ai-builder' );
		}

		$raw = preg_replace( '/\s+/', ' ', $raw );
		$raw = is_string( $raw ) ? trim( $raw ) : '';

		return '' !== $raw
			? sanitize_text_field( substr( $raw, 0, 480 ) )
			: __( 'Codex request failed.', 'gusy-ai-builder' );
	}

	/**
	 * Split generic messages into provider-specific system and user text.
	 *
	 * @param array<int,array<string,string>> $messages Messages.
	 * @return array{system:string,user:string}
	 */
	private function split_messages( array $messages ): array {
		$system = '';
		$user   = '';

		foreach ( $messages as $message ) {
			$role    = (string) ( $message['role'] ?? 'user' );
			$content = (string) ( $message['content'] ?? '' );

			if ( 'system' === $role ) {
				$system .= "\n" . $content;
			} else {
				$user .= "\n" . $content;
			}
		}

		return array(
			'system' => trim( $system ),
			'user'   => trim( $user ),
		);
	}

	/**
	 * POST /responses.
	 *
	 * @param array<string,mixed> $settings Settings.
	 * @param array<string,mixed> $body Body.
	 * @return array<string,mixed>|WP_Error
	 */
	private function post_responses( array $settings, array $body ) {
		$base_url = untrailingslashit( (string) $settings['baseUrl'] );
		$endpoint = str_ends_with( $base_url, '/responses' ) ? $base_url : $base_url . '/responses';

		return $this->post_json( $settings, $endpoint, $body );
	}

	/**
	 * POST /messages to Anthropic.
	 *
	 * @param array<string,mixed> $settings Settings.
	 * @param array<string,mixed> $body Body.
	 * @return array<string,mixed>|WP_Error
	 */
	private function post_anthropic_messages( array $settings, array $body ) {
		$base_url = untrailingslashit( (string) $settings['baseUrl'] );
		$endpoint = str_ends_with( $base_url, '/messages' ) ? $base_url : $base_url . '/messages';

		return $this->post_json(
			$settings,
			$endpoint,
			$body,
			array(
				'x-api-key'         => (string) $settings['apiKey'],
				'anthropic-version' => '2023-06-01',
				'Content-Type'      => 'application/json',
			)
		);
	}

	/**
	 * POST :generateContent to Gemini.
	 *
	 * @param array<string,mixed> $settings Settings.
	 * @param array<string,mixed> $body Body.
	 * @return array<string,mixed>|WP_Error
	 */
	private function post_gemini_generate_content( array $settings, array $body ) {
		$base_url = untrailingslashit( (string) $settings['baseUrl'] );
		$model    = preg_replace( '#^models/#', '', (string) $settings['model'] );
		$endpoint = $base_url . '/models/' . rawurlencode( (string) $model ) . ':generateContent?key=' . rawurlencode( (string) $settings['apiKey'] );

		return $this->post_json(
			$settings,
			$endpoint,
			$body,
			array(
				'Content-Type' => 'application/json',
			)
		);
	}

	/**
	 * POST /chat/completions.
	 *
	 * @param array<string,mixed> $settings Settings.
	 * @param array<string,mixed> $body Body.
	 * @return array<string,mixed>|WP_Error
	 */
	private function post_chat_completion( array $settings, array $body ) {
		$base_url = untrailingslashit( (string) $settings['baseUrl'] );
		$endpoint = str_ends_with( $base_url, '/chat/completions' ) ? $base_url : $base_url . '/chat/completions';

		return $this->post_json( $settings, $endpoint, $body );
	}

	/**
	 * POST JSON to the LLM endpoint.
	 *
	 * @param array<string,mixed> $settings Settings.
	 * @param string              $endpoint Endpoint.
	 * @param array<string,mixed> $body Body.
	 * @return array<string,mixed>|WP_Error
	 */
	private function post_json( array $settings, string $endpoint, array $body, array $headers = array() ) {
		if ( empty( $headers ) ) {
			$headers = array(
				'Authorization' => 'Bearer ' . (string) $settings['apiKey'],
				'Content-Type'  => 'application/json',
			);
		}

		$response = wp_remote_post(
			$endpoint,
			array(
				'timeout' => (int) $settings['timeout'],
				'headers' => $headers,
				'body'    => wp_json_encode( $body ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$raw    = (string) wp_remote_retrieve_body( $response );
		$data   = json_decode( $raw, true );

		if ( $status < 200 || $status >= 300 ) {
			return new WP_Error(
				'gusy_llm_http_' . $status,
				$this->remote_error_message( $data, $raw, $status ),
				array( 'status' => 502 )
			);
		}

		if ( ! is_array( $data ) ) {
			return new WP_Error( 'gusy_llm_response_invalid', __( 'LLM response is not valid JSON.', 'gusy-ai-builder' ), array( 'status' => 502 ) );
		}

		return $data;
	}

	/**
	 * Keep provider errors useful without reflecting full remote payloads.
	 *
	 * @param mixed  $data Decoded response.
	 * @param string $raw Raw response body.
	 * @param int    $status HTTP status.
	 */
	private function remote_error_message( $data, string $raw, int $status ): string {
		$message = '';
		if ( is_array( $data ) ) {
			$message = (string) ( $data['error']['message'] ?? $data['message'] ?? '' );
		}
		if ( '' === $message ) {
			$message = sprintf( 'LLM request failed with HTTP %d.', $status );
		}

		$message = sanitize_text_field( preg_replace( '/\s+/', ' ', $message ) ?: '' );
		if ( '' === $message && '' !== $raw ) {
			$message = __( 'LLM request failed.', 'gusy-ai-builder' );
		}

		return substr( $message, 0, 220 );
	}

	/**
	 * Extract text from a Responses API payload.
	 *
	 * @param array<string,mixed> $response Response.
	 */
	private function extract_responses_text( array $response ): string {
		if ( isset( $response['output_text'] ) && is_string( $response['output_text'] ) ) {
			return $response['output_text'];
		}

		$text   = '';
		$output = isset( $response['output'] ) && is_array( $response['output'] ) ? $response['output'] : array();

		foreach ( $output as $item ) {
			if ( ! is_array( $item ) || ! isset( $item['content'] ) || ! is_array( $item['content'] ) ) {
				continue;
			}

			foreach ( $item['content'] as $content ) {
				if ( is_array( $content ) && isset( $content['text'] ) && is_string( $content['text'] ) ) {
					$text .= $content['text'];
				}
			}
		}

		return $text;
	}

	/**
	 * Extract text from an Anthropic Messages API payload.
	 *
	 * @param array<string,mixed> $response Response.
	 */
	private function extract_anthropic_text( array $response ): string {
		$text    = '';
		$content = isset( $response['content'] ) && is_array( $response['content'] ) ? $response['content'] : array();

		foreach ( $content as $block ) {
			if ( is_array( $block ) && isset( $block['text'] ) && is_string( $block['text'] ) ) {
				$text .= $block['text'];
			}
		}

		return $text;
	}

	/**
	 * Extract text from a Gemini generateContent payload.
	 *
	 * @param array<string,mixed> $response Response.
	 */
	private function extract_gemini_text( array $response ): string {
		$text       = '';
		$candidates = isset( $response['candidates'] ) && is_array( $response['candidates'] ) ? $response['candidates'] : array();

		foreach ( $candidates as $candidate ) {
			if ( ! is_array( $candidate ) ) {
				continue;
			}

			$parts = isset( $candidate['content']['parts'] ) && is_array( $candidate['content']['parts'] ) ? $candidate['content']['parts'] : array();
			foreach ( $parts as $part ) {
				if ( is_array( $part ) && isset( $part['text'] ) && is_string( $part['text'] ) ) {
					$text .= $part['text'];
				}
			}
		}

		return $text;
	}

	/**
	 * Extract JSON from model text.
	 *
	 * @return array<string,mixed>|null
	 */
	private function extract_json( string $content ): ?array {
		$content = trim( $content );
		$decoded = json_decode( $content, true );
		if ( is_array( $decoded ) ) {
			return $decoded;
		}

		if ( preg_match( '/\{(?:.|\n)*\}/', $content, $matches ) ) {
			$decoded = json_decode( $matches[0], true );
			if ( is_array( $decoded ) ) {
				return $decoded;
			}
		}

		return null;
	}
}
