/**
 * API CONSISTENCY CHECKER
 * 
 * Verifica que las rutas del backend estén correctamente conectadas con el frontend
 * y que los tipos TypeScript sean consistentes.
 */

import * as fs from 'fs';
import * as path from 'path';

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

interface RouteDefinition {
  method: string;
  path: string;
  file: string;
  line?: number;
}

interface APIClientCall {
  functionName: string;
  method: string;
  path: string;
  file: string;
  line?: number;
}

interface Issue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

const issues: Issue[] = [];

// Función para leer archivo
function readFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    return '';
  }
}

// Extraer rutas del backend con sus prefijos
function extractBackendRoutes(): RouteDefinition[] {
  const routes: RouteDefinition[] = [];
  const routesDir = path.join(__dirname, '../backend/src/routes');
  
  if (!fs.existsSync(routesDir)) {
    issues.push({
      severity: 'error',
      message: 'Backend routes directory not found',
      details: routesDir
    });
    return routes;
  }
  
  // Mapeo de archivos de rutas a sus prefijos en index.ts
  const routePrefixes: Record<string, string> = {
    'auth.routes.ts': '/api/auth',
    'exam.routes.ts': '/api/exams',
    'user.routes.ts': '/api/users',
    'dashboard.routes.ts': '/api/dashboard',
    'weekly-actions.routes.ts': '/api/weekly-actions',
    'biomarker-history.routes.ts': '/api/biomarkers',
    'weekly-transition.routes.ts': '/api/weekly-transition',
  };
  
  const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));
  
  for (const file of routeFiles) {
    const filePath = path.join(routesDir, file);
    const content = readFile(filePath);
    const prefix = routePrefixes[file] || '';
    
    // Buscar definiciones de rutas: router.get(), router.post(), etc.
    const routeRegex = /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = routeRegex.exec(content)) !== null) {
      const routePath = match[2] === '/' ? prefix : `${prefix}${match[2]}`;
      routes.push({
        method: match[1].toUpperCase(),
        path: routePath,
        file: file,
      });
    }
  }
  
  return routes;
}

// Extraer llamadas del frontend
function extractFrontendAPICalls(): APIClientCall[] {
  const calls: APIClientCall[] = [];
  const apiFile = path.join(__dirname, '../frontend/lib/api.ts');
  
  if (!fs.existsSync(apiFile)) {
    issues.push({
      severity: 'error',
      message: 'Frontend API file not found',
      details: apiFile
    });
    return calls;
  }
  
  const content = readFile(apiFile);
  
  // Buscar llamadas fetch con diferentes patrones
  // Patrón 1: fetch con method en objeto
  const fetchRegex1 = /fetch\s*\(\s*`\$\{API_BASE_URL\}([^`]+)`[^)]*\{[^}]*method:\s*['"`](\w+)['"`]/gs;
  let match;
  
  while ((match = fetchRegex1.exec(content)) !== null) {
    calls.push({
      functionName: 'unknown',
      method: match[2].toUpperCase(),
      path: match[1].replace(/\$\{[^}]+\}/g, ':param'),
      file: 'api.ts',
    });
  }
  
  // Patrón 2: fetch sin method explícito (GET por defecto)
  const fetchRegex2 = /fetch\s*\(\s*`\$\{API_BASE_URL\}([^`]+)`\s*,\s*\{[^}]*headers:/gs;
  
  while ((match = fetchRegex2.exec(content)) !== null) {
    const path = match[1].replace(/\$\{[^}]+\}/g, ':param');
    // Solo agregar si no existe ya
    const exists = calls.some(c => c.path === path && c.method === 'GET');
    if (!exists) {
      calls.push({
        functionName: 'unknown',
        method: 'GET',
        path: path,
        file: 'api.ts',
      });
    }
  }
  
  return calls;
}

// Verificar que las rutas del backend estén registradas en index.ts
function checkBackendRegistration(): void {
  const indexPath = path.join(__dirname, '../backend/src/index.ts');
  const indexContent = readFile(indexPath);
  
  const routeFiles = [
    { file: 'auth.routes', mount: '/api/auth' },
    { file: 'exam.routes', mount: '/api/exams' },
    { file: 'user.routes', mount: '/api/users' },
    { file: 'dashboard.routes', mount: '/api/dashboard' },
    { file: 'weekly-actions.routes', mount: '/api/weekly-actions' },
    { file: 'biomarker-history.routes', mount: '/api/biomarkers' },
    { file: 'weekly-transition.routes', mount: '/api/weekly-transition' },
  ];
  
  for (const route of routeFiles) {
    const importRegex = new RegExp(`import.*from.*['"\`].*${route.file}.*['"\`]`, 'i');
    const useRegex = new RegExp(`app\\.use\\s*\\(\\s*['"\`]${route.mount}['"\`]`, 'i');
    
    const hasImport = importRegex.test(indexContent);
    const hasUse = useRegex.test(indexContent);
    
    if (!hasImport) {
      issues.push({
        severity: 'error',
        message: `Route file not imported: ${route.file}`,
        details: `Add: import ${route.file.replace('.routes', 'Routes')} from './routes/${route.file}';`
      });
    }
    
    if (!hasUse) {
      issues.push({
        severity: 'error',
        message: `Route not registered: ${route.mount}`,
        details: `Add: app.use('${route.mount}', ${route.file.replace('.routes', 'Routes')});`
      });
    }
  }
}

// Normalizar path para comparación
function normalizePath(path: string): string {
  return path
    .replace(/:[^/]+/g, ':param') // :id -> :param
    .replace(/\/+/g, '/') // múltiples / -> /
    .replace(/\/$/, ''); // remover / final
}

// Comparar rutas backend vs frontend
function compareRoutes(backendRoutes: RouteDefinition[], frontendCalls: APIClientCall[]): void {
  const backendMap = new Map<string, RouteDefinition[]>();
  
  // Agrupar rutas del backend
  for (const route of backendRoutes) {
    const key = `${route.method} ${normalizePath(route.path)}`;
    if (!backendMap.has(key)) {
      backendMap.set(key, []);
    }
    backendMap.get(key)!.push(route);
  }
  
  // Verificar que cada llamada del frontend tenga una ruta en el backend
  for (const call of frontendCalls) {
    const key = `${call.method} ${normalizePath(call.path)}`;
    
    if (!backendMap.has(key)) {
      issues.push({
        severity: 'warning',
        message: `Frontend calls non-existent backend route`,
        details: `${call.method} ${call.path} (in ${call.file})`
      });
    }
  }
}

// Verificar que existan los controladores
function checkControllers(): void {
  const controllersDir = path.join(__dirname, '../backend/src/controllers');
  
  if (!fs.existsSync(controllersDir)) {
    issues.push({
      severity: 'warning',
      message: 'Controllers directory not found',
      details: controllersDir
    });
    return;
  }
  
  const controllerFiles = fs.readdirSync(controllersDir).filter(f => f.endsWith('.ts'));
  
  issues.push({
    severity: 'info',
    message: `Found ${controllerFiles.length} controller files`,
    details: controllerFiles.join(', ')
  });
}

// Función principal
function main() {
  console.log(`\n${colors.blue}🔍 API Consistency Checker${colors.reset}`);
  console.log('='.repeat(50));
  console.log('');
  
  // 1. Extraer rutas del backend
  console.log(`${colors.magenta}📋 Extracting backend routes...${colors.reset}`);
  const backendRoutes = extractBackendRoutes();
  console.log(`   Found ${backendRoutes.length} routes\n`);
  
  // 2. Extraer llamadas del frontend
  console.log(`${colors.magenta}📋 Extracting frontend API calls...${colors.reset}`);
  const frontendCalls = extractFrontendAPICalls();
  console.log(`   Found ${frontendCalls.length} API calls\n`);
  
  // 3. Verificar registro en index.ts
  console.log(`${colors.magenta}📋 Checking backend registration...${colors.reset}`);
  checkBackendRegistration();
  console.log('   Done\n');
  
  // 4. Comparar rutas
  console.log(`${colors.magenta}📋 Comparing routes...${colors.reset}`);
  compareRoutes(backendRoutes, frontendCalls);
  console.log('   Done\n');
  
  // 5. Verificar controladores
  console.log(`${colors.magenta}📋 Checking controllers...${colors.reset}`);
  checkControllers();
  console.log('   Done\n');
  
  // Mostrar resultados
  console.log('='.repeat(50));
  console.log(`${colors.blue}📊 Results${colors.reset}\n`);
  
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');
  
  if (errors.length > 0) {
    console.log(`${colors.red}❌ Errors (${errors.length}):${colors.reset}`);
    errors.forEach(issue => {
      console.log(`   ${colors.red}•${colors.reset} ${issue.message}`);
      if (issue.details) {
        console.log(`     ${colors.yellow}→${colors.reset} ${issue.details}`);
      }
    });
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log(`${colors.yellow}⚠️  Warnings (${warnings.length}):${colors.reset}`);
    warnings.forEach(issue => {
      console.log(`   ${colors.yellow}•${colors.reset} ${issue.message}`);
      if (issue.details) {
        console.log(`     ${colors.yellow}→${colors.reset} ${issue.details}`);
      }
    });
    console.log('');
  }
  
  if (infos.length > 0) {
    console.log(`${colors.blue}ℹ️  Info (${infos.length}):${colors.reset}`);
    infos.forEach(issue => {
      console.log(`   ${colors.blue}•${colors.reset} ${issue.message}`);
      if (issue.details) {
        console.log(`     ${colors.blue}→${colors.reset} ${issue.details}`);
      }
    });
    console.log('');
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`${colors.green}✅ All checks passed!${colors.reset}\n`);
  }
  
  console.log('='.repeat(50));
  console.log('');
  
  // Exit code
  process.exit(errors.length > 0 ? 1 : 0);
}

// Ejecutar
main();
