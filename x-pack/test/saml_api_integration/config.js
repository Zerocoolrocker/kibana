/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { resolveKibanaPath } from '@kbn/plugin-helpers/lib/index';
import { resolve } from 'path';

export default async function ({ readConfigFile }) {
  const kibanaAPITestsConfig = await readConfigFile(resolveKibanaPath('test/api_integration/config.js'));
  const xPackAPITestsConfig = await readConfigFile(require.resolve('../api_integration/config.js'));

  const kibanaPort = xPackAPITestsConfig.get('servers.kibana.port');
  const idpPath = resolve(__dirname, '../../test/saml_api_integration/fixtures/idp_metadata.xml');

  return {
    testFiles: [require.resolve('./apis')],
    servers: xPackAPITestsConfig.get('servers'),
    services: {
      chance: kibanaAPITestsConfig.get('services.chance'),
      supertestWithoutAuth: xPackAPITestsConfig.get('services.supertestWithoutAuth'),
    },
    junit: {
      reportName: 'X-Pack SAML API Integration Tests',
    },
    env: xPackAPITestsConfig.get('env'),

    esTestCluster: {
      ...xPackAPITestsConfig.get('esTestCluster'),
      serverArgs: [
        ...xPackAPITestsConfig.get('esTestCluster.serverArgs'),
        'xpack.security.authc.token.enabled=true',
        'xpack.security.authc.token.timeout=15s',
        'xpack.security.authc.realms.saml1.type=saml',
        'xpack.security.authc.realms.saml1.order=0',
        `xpack.security.authc.realms.saml1.idp.metadata.path=${idpPath}`,
        'xpack.security.authc.realms.saml1.idp.entity_id=http://www.elastic.co',
        `xpack.security.authc.realms.saml1.sp.entity_id=http://localhost:${kibanaPort}`,
        `xpack.security.authc.realms.saml1.sp.logout=http://localhost:${kibanaPort}/logout`,
        `xpack.security.authc.realms.saml1.sp.acs=http://localhost:${kibanaPort}/api/security/v1/saml`,
        'xpack.security.authc.realms.saml1.attributes.principal=urn:oid:0.0.7',
      ],
    },

    kibanaServerArgs: [
      ...xPackAPITestsConfig.get('kibanaServerArgs'),
      '--optimize.enabled=false',
      '--server.xsrf.whitelist=[\"/api/security/v1/saml\"]',
      '--xpack.security.authProviders=[\"saml\"]',
    ],
  };
}