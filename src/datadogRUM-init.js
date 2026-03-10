import { datadogRum } from '@datadog/browser-rum';
import { reactPlugin } from '@datadog/browser-rum-react';
                    
datadogRum.init({
    applicationId: '468857ab-5f72-4e10-8e9d-3737ddeff831',
    clientToken: 'pub4722ee9cd2526282cbb772106d1e7eed',
    site: 'us3.datadoghq.com',
    service: '<SERVICE-NAME>',
    env: '<ENV-NAME>',
    version: '<VERSION-NUMBER>',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackResources: true,
    trackUserInteractions: true,
    trackLongTasks: true,
    plugins: [reactPlugin({ router: false })],
});