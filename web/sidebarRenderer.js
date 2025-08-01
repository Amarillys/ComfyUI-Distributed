import { BUTTON_STYLES } from './constants.js';

export async function renderSidebarContent(extension, el) {
    // Panel is being opened/rendered
    extension.log("Panel opened", "debug");
    
    if (!el) {
        extension.log("No element provided to renderSidebarContent", "debug");
        return;
    }
    
    // Prevent infinite recursion
    if (extension._isRendering) {
        extension.log("Already rendering, skipping", "debug");
        return;
    }
    extension._isRendering = true;
    
    try {
        // Store reference to the panel element
        extension.panelElement = el;
        
        // Show loading indicator
        el.innerHTML = '';
        const loadingDiv = document.createElement("div");
        loadingDiv.style.cssText = "display: flex; align-items: center; justify-content: center; height: calc(100vh - 100px); color: #888;";
        loadingDiv.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" style="color: #888;">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="40 40"/>
        </svg>`;
        el.appendChild(loadingDiv);
        
        // Add rotation animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        loadingDiv.querySelector('svg').style.animation = 'rotate 1s linear infinite';
        
        // Preload data outside render
        await extension.loadConfig();
        await extension.loadManagedWorkers();
        
        el.innerHTML = '';
        
        // Create toolbar header to match ComfyUI style
        const toolbar = document.createElement("div");
        toolbar.className = "p-toolbar p-component border-x-0 border-t-0 rounded-none px-2 py-1 min-h-8";
        toolbar.style.cssText = "border-bottom: 1px solid #444; background: transparent; display: flex; align-items: center;";
        
        const toolbarStart = document.createElement("div");
        toolbarStart.className = "p-toolbar-start";
        toolbarStart.style.cssText = "display: flex; align-items: center;";
        
        const titleSpan = document.createElement("span");
        titleSpan.className = "text-xs 2xl:text-sm truncate";
        titleSpan.textContent = "COMFYUI DISTRIBUTED";
        titleSpan.title = "ComfyUI Distributed";
        
        toolbarStart.appendChild(titleSpan);
        toolbar.appendChild(toolbarStart);
        
        const toolbarCenter = document.createElement("div");
        toolbarCenter.className = "p-toolbar-center";
        toolbar.appendChild(toolbarCenter);
        
        const toolbarEnd = document.createElement("div");
        toolbarEnd.className = "p-toolbar-end";
        toolbar.appendChild(toolbarEnd);
        
        el.appendChild(toolbar);
        
        // Main container with adjusted padding
        const container = document.createElement("div");
        container.style.cssText = "padding: 15px; display: flex; flex-direction: column; height: calc(100% - 32px);";
        
        // Detect master info on panel open (in case CUDA info wasn't available at startup)
        extension.log(`Panel opened. CUDA device count: ${extension.cudaDeviceCount}, Workers: ${extension.config?.workers?.length || 0}`, "debug");
        if (!extension.cudaDeviceCount) {
            await extension.detectMasterIP();
        }
        
        
        // Now render with guaranteed up-to-date config
        // Master Node Section
        const masterDiv = extension.ui.renderEntityCard('master', extension.config?.master, extension);
        container.appendChild(masterDiv);
        
        // Workers Section (no heading)
        const gpuSection = document.createElement("div");
        gpuSection.style.cssText = "flex: 1; overflow-y: auto; margin-bottom: 15px;";
        
        const gpuList = document.createElement("div");
        const workers = extension.config?.workers || [];
        
        // If no workers exist, show a full blueprint placeholder first
        if (workers.length === 0) {
            const blueprintDiv = extension.ui.renderEntityCard('blueprint', { onClick: () => extension.addNewWorker() }, extension);
            gpuList.appendChild(blueprintDiv);
        }
        
        // Show existing workers
        workers.forEach(worker => {
            const gpuDiv = extension.ui.renderEntityCard('worker', worker, extension);
            gpuList.appendChild(gpuDiv);
        });
        gpuSection.appendChild(gpuList);
        
        // Only show the minimal "Add Worker" box if there are existing workers
        if (workers.length > 0) {
            const addWorkerDiv = extension.ui.renderEntityCard('add', { onClick: () => extension.addNewWorker() }, extension);
            gpuSection.appendChild(addWorkerDiv);
        }
        
        container.appendChild(gpuSection);
        
        const actionsSection = document.createElement("div");
        actionsSection.style.cssText = "padding-top: 10px; margin-bottom: 15px; border-top: 1px solid #444;";
        
        // Create a row for both buttons
        const buttonRow = document.createElement("div");
        buttonRow.style.cssText = "display: flex; gap: 8px;";
        
        const clearMemButton = extension.ui.createButtonHelper(
            "Clear Worker VRAM",
            (e) => extension._handleClearMemory(e.target),
            BUTTON_STYLES.clearMemory
        );
        clearMemButton.title = "Clear VRAM on all enabled worker GPUs (not master)";
        clearMemButton.style.cssText = BUTTON_STYLES.base + " flex: 1;" + BUTTON_STYLES.clearMemory;
        
        const interruptButton = extension.ui.createButtonHelper(
            "Interrupt Workers",
            (e) => extension._handleInterruptWorkers(e.target),
            BUTTON_STYLES.interrupt
        );
        interruptButton.title = "Cancel/interrupt execution on all enabled worker GPUs";
        interruptButton.style.cssText = BUTTON_STYLES.base + " flex: 1;" + BUTTON_STYLES.interrupt;
        
        buttonRow.appendChild(clearMemButton);
        buttonRow.appendChild(interruptButton);
        actionsSection.appendChild(buttonRow);
        
        container.appendChild(actionsSection);
        
        // Settings section
        const settingsSection = document.createElement("div");
        settingsSection.style.cssText = "border-top: 1px solid #444; padding-top: 10px; margin-bottom: 10px;";
        
        // Settings header with toggle
        const settingsHeader = document.createElement("div");
        settingsHeader.style.cssText = "display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none;";
        
        const workerSettingsTitle = document.createElement("h4");
        workerSettingsTitle.textContent = "Settings";
        workerSettingsTitle.style.cssText = "margin: 0; font-size: 14px;";
        
        const workerSettingsToggle = document.createElement("span");
        workerSettingsToggle.textContent = "▶"; // Right arrow when collapsed
        workerSettingsToggle.style.cssText = "font-size: 12px; color: #888; transition: all 0.2s ease;";
        
        settingsHeader.appendChild(workerSettingsTitle);
        settingsHeader.appendChild(workerSettingsToggle);
        
        // Hover effect for header
        settingsHeader.onmouseover = () => {
            workerSettingsToggle.style.color = "#fff";
        };
        settingsHeader.onmouseout = () => {
            workerSettingsToggle.style.color = "#888";
        };
        
        // Collapsible settings content
        const settingsContent = document.createElement("div");
        settingsContent.style.cssText = "max-height: 0; overflow: hidden; opacity: 0; transition: max-height 0.3s ease, opacity 0.3s ease;";
        
        const settingsDiv = document.createElement("div");
        settingsDiv.style.cssText = "display: flex; flex-direction: column; gap: 8px; padding-top: 10px;";
        
        // Toggle functionality
        let settingsExpanded = false;
        settingsHeader.onclick = () => {
            settingsExpanded = !settingsExpanded;
            if (settingsExpanded) {
                settingsContent.style.maxHeight = "200px";
                settingsContent.style.opacity = "1";
                workerSettingsToggle.style.transform = "rotate(90deg)";
            } else {
                settingsContent.style.maxHeight = "0";
                settingsContent.style.opacity = "0";
                workerSettingsToggle.style.transform = "rotate(0deg)";
            }
        };
        
        // Debug mode setting
        const debugGroup = document.createElement("div");
        debugGroup.style.cssText = "display: flex; align-items: center; gap: 8px;";
        
        const debugCheckbox = document.createElement("input");
        debugCheckbox.type = "checkbox";
        debugCheckbox.id = "setting-debug";
        debugCheckbox.checked = extension.config?.settings?.debug || false;
        debugCheckbox.onchange = (e) => extension._updateSetting('debug', e.target.checked);
        
        const debugLabel = document.createElement("label");
        debugLabel.htmlFor = "setting-debug";
        debugLabel.textContent = "Debug Mode";
        debugLabel.style.cssText = "font-size: 12px; color: #ccc; cursor: pointer;";
        
        debugGroup.appendChild(debugCheckbox);
        debugGroup.appendChild(debugLabel);
        
        // Auto-launch workers setting
        const autoLaunchGroup = document.createElement("div");
        autoLaunchGroup.style.cssText = "display: flex; align-items: center; gap: 8px;";
        
        const autoLaunchCheckbox = document.createElement("input");
        autoLaunchCheckbox.type = "checkbox";
        autoLaunchCheckbox.id = "setting-auto-launch";
        autoLaunchCheckbox.checked = extension.config?.settings?.auto_launch_workers || false;
        autoLaunchCheckbox.onchange = (e) => extension._updateSetting('auto_launch_workers', e.target.checked);
        
        const autoLaunchLabel = document.createElement("label");
        autoLaunchLabel.htmlFor = "setting-auto-launch";
        autoLaunchLabel.textContent = "Auto-launch Local Workers on Startup";
        autoLaunchLabel.style.cssText = "font-size: 12px; color: #ccc; cursor: pointer;";
        
        autoLaunchGroup.appendChild(autoLaunchCheckbox);
        autoLaunchGroup.appendChild(autoLaunchLabel);
        
        // Stop workers on exit setting
        const stopOnExitGroup = document.createElement("div");
        stopOnExitGroup.style.cssText = "display: flex; align-items: center; gap: 8px;";
        
        const stopOnExitCheckbox = document.createElement("input");
        stopOnExitCheckbox.type = "checkbox";
        stopOnExitCheckbox.id = "setting-stop-on-exit";
        stopOnExitCheckbox.checked = extension.config?.settings?.stop_workers_on_master_exit !== false; // Default true
        stopOnExitCheckbox.onchange = (e) => extension._updateSetting('stop_workers_on_master_exit', e.target.checked);
        
        const stopOnExitLabel = document.createElement("label");
        stopOnExitLabel.htmlFor = "setting-stop-on-exit";
        stopOnExitLabel.textContent = "Stop Local Workers on Master Exit";
        stopOnExitLabel.style.cssText = "font-size: 12px; color: #ccc; cursor: pointer;";
        
        stopOnExitGroup.appendChild(stopOnExitCheckbox);
        stopOnExitGroup.appendChild(stopOnExitLabel);
        
        settingsDiv.appendChild(debugGroup);
        settingsDiv.appendChild(autoLaunchGroup);
        settingsDiv.appendChild(stopOnExitGroup);
        settingsContent.appendChild(settingsDiv);
        
        settingsSection.appendChild(settingsHeader);
        settingsSection.appendChild(settingsContent);
        container.appendChild(settingsSection);

        const summarySection = document.createElement("div");
        summarySection.style.cssText = "border-top: 1px solid #444; padding-top: 10px;";
        const summary = document.createElement("div");
        summary.id = "distributed-summary";
        summary.style.cssText = "font-size: 11px; color: #888;";
        summarySection.appendChild(summary);
        container.appendChild(summarySection);
        el.appendChild(container);
        extension.updateSummary();
        
        // Start checking worker statuses immediately in parallel
        setTimeout(() => extension.checkAllWorkerStatuses(), 0);
    } finally {
        // Always reset the rendering flag
        extension._isRendering = false;
    }
}