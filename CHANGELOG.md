# Changelog

## [1.1.0](https://github.com/GabrielZavando/API-Agencia/compare/api-v1.0.0...api-v1.1.0) (2026-03-14)


### Features

* **anti-spam:** implementar medidas anti-spam completas y campaña de re-confirmación ([4eab4de](https://github.com/GabrielZavando/API-Agencia/commit/4eab4ded8718bc805d592fff9b43bf166b85855c))
* **blog:** implement memory-based filtering and update architecture ([059c0cc](https://github.com/GabrielZavando/API-Agencia/commit/059c0cc9fc83b2c92e8bc886c4ea812e7cc09ce6))
* implement files, reports, and support modules; remove projects ([c5c0252](https://github.com/GabrielZavando/API-Agencia/commit/c5c0252e0ce127bd5ac1c248e3679e27be631ead))
* implement idea mailbox with admin notifications ([b5a282e](https://github.com/GabrielZavando/API-Agencia/commit/b5a282e09c4d49aab4175d285c4940a006f92187))
* implement multi-account email support and subscriber management tools ([a4e7a9b](https://github.com/GabrielZavando/API-Agencia/commit/a4e7a9bc4115f7f39dcefe42fef2ea273aa789de))
* implementación de pipeline CI/CD avanzado con GPT-5.4 ([e65482a](https://github.com/GabrielZavando/API-Agencia/commit/e65482a15cfaae9740e097eb6d3caa8287a2918b))
* Implementar sistema completo de newsletter y notificaciones administrativas ([add9c48](https://github.com/GabrielZavando/API-Agencia/commit/add9c48e0c5a24481fbab0fc6f3c29b14d8cabde))
* project-centric updates, authentication modules, and email templates ([b2d1d9c](https://github.com/GabrielZavando/API-Agencia/commit/b2d1d9c953ef8481b95b4adfb7bd8577eabed899))
* **projects:** refactoriza sistema de soporte y cuotas basado en proyectos ([2f28a06](https://github.com/GabrielZavando/API-Agencia/commit/2f28a06a265d40085c164ed242ed4d501d849127))
* re-integrate ai models (claude for secops, gpt-5.4 for releases) ([8965579](https://github.com/GabrielZavando/API-Agencia/commit/8965579c363edfcff86d38dcb2c3d30fd4c465b2))
* setup ai-powered cicd pipeline with gpt-5.4 and release-please ([3516117](https://github.com/GabrielZavando/API-Agencia/commit/35161178ac7c35a3cdeeaf98ffd6db6fea68d8b3))
* **support:** add dynamic client name in email templates ([7729026](https://github.com/GabrielZavando/API-Agencia/commit/77290268a32a8c1107dc0b4e8b2e3a7968576e18))
* **support:** implement project-centric ticket quotas ([7d52329](https://github.com/GabrielZavando/API-Agencia/commit/7d523299f05d2ff03972634235bc661a56cdea5d))


### Bug Fixes

* **build:** add missing dotenv dependency for standalone scripts ([f3627ac](https://github.com/GabrielZavando/API-Agencia/commit/f3627ac6869e308449ca9fd209832fff9163d0d9))
* **build:** resolve Multer types in Docker and cleanup Jest dependencies ([fb62907](https://github.com/GabrielZavando/API-Agencia/commit/fb62907b8f0f16706318cc1ddb5922428df2c06f))
* **build:** resolve Multer types in Docker and cleanup Jest dependencies ([a926239](https://github.com/GabrielZavando/API-Agencia/commit/a9262399e3c5415b909f47609cf15ae8768cce7d))
* **ci:** remove incorrect working-directory and update pnpm to v9 ([0c3d641](https://github.com/GabrielZavando/API-Agencia/commit/0c3d64112d8b4d8a1008a8c58e107f96ee30eaef))
* **ci:** update pnpm to v10 and cleanup package.json for vitest compatibility ([ff16732](https://github.com/GabrielZavando/API-Agencia/commit/ff167326d1b81286d69949c4334fe2f463fd19a2))
* **deploy:** correct docker build path ([e9ac914](https://github.com/GabrielZavando/API-Agencia/commit/e9ac91468a24ca8140ab3124e4ca45023958ce1d))
* **deploy:** correct docker build path ([ae5d4d4](https://github.com/GabrielZavando/API-Agencia/commit/ae5d4d46fabfb52c6b119d603f0c89d6de44bc25))
* **docker:** remove redundant and failing COPY instructions ([3214114](https://github.com/GabrielZavando/API-Agencia/commit/32141142815cfde2db3c43ab7fcc6e9c6aabc3b6))
* **docker:** remove redundant and failing COPY instructions ([a551a29](https://github.com/GabrielZavando/API-Agencia/commit/a551a295f13d2ae0cfcd5029b6ed75bf9b6b4417))
* **main:** listen on 0.0.0.0 for Cloud Run compatibility ([2cc78c3](https://github.com/GabrielZavando/API-Agencia/commit/2cc78c34dead2fb87abc7de69f97a574a7016087))
* **main:** listen on 0.0.0.0 for Cloud Run compatibility ([d6aacd6](https://github.com/GabrielZavando/API-Agencia/commit/d6aacd616164b0d397b6757b884e487142538903))
* **release:** correct config and manifest paths ([656cf1f](https://github.com/GabrielZavando/API-Agencia/commit/656cf1f1b605b96f3c53cf92107130a7696475c8))
* **release:** root path configuration for manifest and config ([9ac7271](https://github.com/GabrielZavando/API-Agencia/commit/9ac7271cecdd2d0f2db38c41ab9d125ad1ce34a6))
* restore vitest dependency and sync lockfile ([f01ac1e](https://github.com/GabrielZavando/API-Agencia/commit/f01ac1e195e1bb3fe4ce7ba10fa21d4e27ad94cd))
* **support:** set null attachmentPath on tickets to prevent firestore undefined error ([7bd0435](https://github.com/GabrielZavando/API-Agencia/commit/7bd0435143000453bb55750eacf8b3e0aecef11e))
