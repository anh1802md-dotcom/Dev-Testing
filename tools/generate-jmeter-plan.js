/**
 * Sinh jmeter/asset-paths.csv và jmeter/medcare-load-test.jmx từ cod1/load-order.js
 * Chạy: node tools/generate-jmeter-plan.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const LOAD_ORDER = path.join(ROOT, "cod1", "load-order.js");
const JMETER_DIR = path.join(ROOT, "jmeter");
const CSV_OUT = path.join(JMETER_DIR, "asset-paths.csv");
const JMX_OUT = path.join(JMETER_DIR, "medcare-load-test.jmx");

const BOOTSTRAP = [
  "index.html",
  "css/app.css",
  "cod1/load-order.js",
  "js/loader.js",
];

function parseLoadOrder() {
  const src = fs.readFileSync(LOAD_ORDER, "utf8");
  const m = src.match(/window\.COD1_LOAD_ORDER\s*=\s*(\[[\s\S]*?\]);/);
  if (!m) throw new Error("Không đọc được COD1_LOAD_ORDER trong cod1/load-order.js");
  return JSON.parse(
    m[1].replace(/'/g, '"').replace(/,\s*]/g, "]")
  );
}

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function httpSampler(name, pathValue, indent = "          ") {
  return `${indent}<HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${xmlEscape(name)}" enabled="true">
${indent}  <stringProp name="HTTPSampler.path">${xmlEscape(pathValue)}</stringProp>
${indent}  <stringProp name="HTTPSampler.method">GET</stringProp>
${indent}  <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
${indent}  <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
${indent}</HTTPSamplerProxy>
${indent}<hashTree>
${indent}  <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="HTTP 200" enabled="true">
${indent}    <collectionProp name="Asserion.test_strings">
${indent}      <stringProp name="49586">200</stringProp>
${indent}    </collectionProp>
${indent}    <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
${indent}    <boolProp name="Assertion.assume_success">false</boolProp>
${indent}    <intProp name="Assertion.test_type">8</intProp>
${indent}  </ResponseAssertion>
${indent}  <hashTree/>
${indent}</hashTree>`;
}

function buildJmx(assetPaths) {
  const bootstrapSamplers = BOOTSTRAP.map((p) => httpSampler(`GET /${p}`, `/${p}`)).join("\n");

  const csvLoopSamplers = `          <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="GET /\${asset_path}" enabled="true">
            <stringProp name="HTTPSampler.path">/\${asset_path}</stringProp>
            <stringProp name="HTTPSampler.method">GET</stringProp>
            <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
            <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          </HTTPSamplerProxy>
          <hashTree>
            <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="HTTP 200" enabled="true">
              <collectionProp name="Asserion.test_strings">
                <stringProp name="49586">200</stringProp>
              </collectionProp>
              <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
              <boolProp name="Assertion.assume_success">false</boolProp>
              <intProp name="Assertion.test_type">8</intProp>
            </ResponseAssertion>
            <hashTree/>
          </hashTree>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="MedCare Load Test" enabled="true">
      <stringProp name="TestPlan.comments">Performance test — static SPA (localhost:3000). Regenerate: node tools/generate-jmeter-plan.js</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments">
          <elementProp name="HOST" elementType="Argument">
            <stringProp name="Argument.name">HOST</stringProp>
            <stringProp name="Argument.value">\${__P(HOST,localhost)}</stringProp>
          </elementProp>
          <elementProp name="PORT" elementType="Argument">
            <stringProp name="Argument.name">PORT</stringProp>
            <stringProp name="Argument.value">\${__P(PORT,3000)}</stringProp>
          </elementProp>
          <elementProp name="THREADS" elementType="Argument">
            <stringProp name="Argument.name">THREADS</stringProp>
            <stringProp name="Argument.value">\${__P(THREADS,10)}</stringProp>
          </elementProp>
          <elementProp name="RAMP_UP" elementType="Argument">
            <stringProp name="Argument.name">RAMP_UP</stringProp>
            <stringProp name="Argument.value">\${__P(RAMP_UP,30)}</stringProp>
          </elementProp>
          <elementProp name="LOOPS" elementType="Argument">
            <stringProp name="Argument.name">LOOPS</stringProp>
            <stringProp name="Argument.value">\${__P(LOOPS,1)}</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Concurrent users — load MedCare SPA" enabled="true">
        <stringProp name="ThreadGroup.num_threads">\${THREADS}</stringProp>
        <stringProp name="ThreadGroup.ramp_time">\${RAMP_UP}</stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">\${LOOPS}</stringProp>
        </elementProp>
      </ThreadGroup>
      <hashTree>
        <ConfigTestElement guiclass="HttpDefaultsGui" testclass="ConfigTestElement" testname="HTTP Request Defaults" enabled="true">
          <stringProp name="HTTPSampler.domain">\${HOST}</stringProp>
          <stringProp name="HTTPSampler.port">\${PORT}</stringProp>
          <stringProp name="HTTPSampler.protocol">http</stringProp>
          <stringProp name="HTTPSampler.contentEncoding">UTF-8</stringProp>
          <stringProp name="HTTPSampler.connect_timeout">5000</stringProp>
          <stringProp name="HTTPSampler.response_timeout">30000</stringProp>
        </ConfigTestElement>
        <hashTree/>
        <CacheManager guiclass="CacheManagerGui" testclass="CacheManager" testname="HTTP Cache Manager" enabled="false"/>
        <hashTree/>
        <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="Browser headers" enabled="true">
          <collectionProp name="HeaderManager.headers">
            <elementProp name="Accept" elementType="Header">
              <stringProp name="Header.name">Accept</stringProp>
              <stringProp name="Header.value">text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8</stringProp>
            </elementProp>
            <elementProp name="Accept-Language" elementType="Header">
              <stringProp name="Header.name">Accept-Language</stringProp>
              <stringProp name="Header.value">vi-VN,vi;q=0.9,en;q=0.8</stringProp>
            </elementProp>
            <elementProp name="User-Agent" elementType="Header">
              <stringProp name="Header.name">User-Agent</stringProp>
              <stringProp name="Header.value">MedCare-JMeter/1.0</stringProp>
            </elementProp>
          </collectionProp>
        </HeaderManager>
        <hashTree/>
        <TransactionController guiclass="TransactionControllerGui" testclass="TransactionController" testname="TX — MedCare first page load (${BOOTSTRAP.length + assetPaths.length} requests)" enabled="true">
          <boolProp name="TransactionController.includeTimers">false</boolProp>
        </TransactionController>
        <hashTree>
${bootstrapSamplers}
          <LoopController guiclass="LoopControlPanel" testclass="LoopController" testname="Loop — app scripts (${assetPaths.length} files)" enabled="true">
            <boolProp name="LoopController.continue_forever">false</boolProp>
            <stringProp name="LoopController.loops">1</stringProp>
          </LoopController>
          <hashTree>
            <CSVDataSet guiclass="TestBeanGUI" testclass="CSVDataSet" testname="CSV — asset-paths.csv" enabled="true">
              <stringProp name="filename">\${__P(CSV,asset-paths.csv)}</stringProp>
              <stringProp name="fileEncoding">UTF-8</stringProp>
              <stringProp name="variableNames">asset_path</stringProp>
              <boolProp name="ignoreFirstLine">true</boolProp>
              <boolProp name="quotedData">false</boolProp>
              <boolProp name="recycle">false</boolProp>
              <boolProp name="stopThread">false</boolProp>
              <stringProp name="shareMode">shareMode.all</stringProp>
            </CSVDataSet>
            <hashTree/>
${csvLoopSamplers}
          </hashTree>
        </hashTree>
        <ResultCollector guiclass="SummaryReport" testclass="ResultCollector" testname="Summary Report" enabled="true">
          <boolProp name="ResultCollector.error_logging">false</boolProp>
          <objProp>
            <name>saveConfig</name>
            <value class="SampleSaveConfiguration">
              <time>true</time>
              <latency>true</latency>
              <timestamp>true</timestamp>
              <success>true</success>
              <label>true</label>
              <code>true</code>
              <message>true</message>
              <threadName>true</threadName>
              <dataType>true</dataType>
              <encoding>false</encoding>
              <assertions>true</assertions>
              <subresults>true</subresults>
              <responseData>false</responseData>
              <samplerData>false</samplerData>
              <xml>false</xml>
              <fieldNames>true</fieldNames>
              <responseHeaders>false</responseHeaders>
              <requestHeaders>false</requestHeaders>
              <responseDataOnError>false</responseDataOnError>
              <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
              <assertionsResultsToSave>0</assertionsResultsToSave>
              <bytes>true</bytes>
              <sentBytes>true</sentBytes>
              <url>true</url>
              <threadCounts>true</threadCounts>
              <idleTime>true</idleTime>
              <connectTime>true</connectTime>
            </value>
          </objProp>
          <stringProp name="filename"></stringProp>
        </ResultCollector>
        <hashTree/>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
`;
}

function main() {
  const assets = parseLoadOrder();
  fs.mkdirSync(JMETER_DIR, { recursive: true });

  const csvLines = ["asset_path", ...assets];
  fs.writeFileSync(CSV_OUT, csvLines.join("\n") + "\n", "utf8");

  const jmx = buildJmx(assets);
  fs.writeFileSync(JMX_OUT, jmx, "utf8");

  console.log(`Generated ${path.relative(ROOT, CSV_OUT)} (${assets.length} script paths)`);
  console.log(`Generated ${path.relative(ROOT, JMX_OUT)}`);
  console.log(`Total HTTP requests per user per loop: ${BOOTSTRAP.length + assets.length}`);
}

main();
