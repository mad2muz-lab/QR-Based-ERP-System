const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 10000 });
    
    // Wait a bit more for React to hydrate
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Check for specific elements from our new dashboard
    const hasKSAText = await page.locator('text=KSA Inventory Dashboard').isVisible();
    console.log(`Has KSA Inventory Dashboard text: ${hasKSAText}`);
    
    const hasTotalWarehouses = await page.locator('text=Total Warehouses').isVisible();
    console.log(`Has Total Warehouses text: ${hasTotalWarehouses}`);
    
    const hasTotalMaterials = await page.locator('text=Total Materials').isVisible();
    console.log(`Has Total Materials text: ${hasTotalMaterials}`);
    
    const hasInventoryUnits = await page.locator('text=Inventory Units').isVisible();
    console.log(`Has Inventory Units text: ${hasInventoryUnits}`);
    
    // Get page content for debugging
    const content = await page.content();
    console.log(`Page content length: ${content.length}`);
    
    // Save screenshot for visual verification
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    console.log('Screenshot saved as debug-screenshot.png');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
})();