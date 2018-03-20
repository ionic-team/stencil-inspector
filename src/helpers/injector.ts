import { Main } from '../components/main/main';

import * as d from './declarations';

export class Injector {
  private static _instance: Injector;

  /** Connection to the background page */
  private bgScriptLink: chrome.runtime.Port;

  /** Reference to the panel */
  private uiInstance: Main = null;

  private constructor() {
    /** Create a connection to the background page */
    this.bgScriptLink = chrome.runtime.connect({
      name: 'stencil-inspector'
    });

    chrome.runtime.onInstalled.addListener(() => window.location.reload());

    const tabId = chrome.devtools.inspectedWindow.tabId;

    /** Register the injector in the background page */
    this.postMsg('register', tabId);

    /** Add navigation listener */
    chrome.devtools.network.onNavigated.addListener(() => {
      this.postMsg('unregister', tabId);

      this.bgScriptLink.disconnect();

      chrome.devtools.panels.elements.onSelectionChanged.removeListener(this.getComponent);

      location.reload();
    });

    /** Listen for messages from background script */
    this.bgScriptLink.onMessage.addListener((message: d.Message) => {
      const {
        data: {
          sender,
          type,
          value
        }
      } = message;

      if (sender === 'background-page') {
        this.bgScriptMsgHandler(type, value);
      } else if (sender === 'scout') {
        this.scoutMsgHandler(type, value);
      }
    });
  }

  static get Instance(): Injector {
    return this._instance || (this._instance = new Injector());
  }

  /** Handle the messages received from background script */
  private bgScriptMsgHandler(type: string, value: any) {
    if (type === 'register') {
      if (value) {
        this.injectScout();
      } else {
        this.uiInstance.changeComponent({
          status: {
            success: false,
            message: 'Dev mode is not active.'
          },
          categories: []
        });
      }
    }
  }

  /** Handle the messages received from scout */
  private scoutMsgHandler(type: string, value: any) {
    if (type === 'component') {
      const parsedData: d.ParsedGroupData = {
        categories: [],
        ...value
      };

      parsedData.categories = ((value.categories || []) as d.CategoryData[])
        .map<d.ParsedCategoryData>((category: d.CategoryData) => {
          const parsedCategory: d.ParsedCategoryData = {
            label: category.label,
            items: []
          };

          if (category.items) {
            const items = category.items;

            if (Array.isArray(category.items)) {
              parsedCategory.items = (items as d.MemberData[])
                .map((item, index) => this.createItem({
                  label: index
                }, item));
            } else if (typeof category.items === 'object') {
              parsedCategory.items = Object.keys(items)
                .map((key) => this.createItem({
                  label: key
                }, items[key]));
            }
          }

          return parsedCategory;
        });

      this.uiInstance.changeComponent(parsedData);
    } else if (type === 'domChanged') {
      this.getComponent();
    }
  }

  /** Send message to the background script */
  private postMsg(type: string, value: any) {
    this.bgScriptLink.postMessage({
      source: 'stencil-inspector',
      data: {
        sender: 'injector',
        type,
        value
      }
    });
  }

  /** Inject the scout in the current window */
  private injectScout() {
    if (this.uiInstance) {
      this.uiInstance.startLoading();
    }

    chrome.devtools.inspectedWindow.eval(
      `
      ((selectedElement) => {
        if (!window.__STENCIL_INSPECTOR__) {
          const script = document.constructor.prototype.createElement.call(document, 'script');
          script.type = 'text/javascript';
          script.src = '${chrome.extension.getURL('helpers/scout.js')}';

          script.onload = () => {
            document.body.removeChild(script);

            window.__STENCIL_INSPECTOR__.getComponent(selectedElement);
          };

          document.body.appendChild(script);
        } else {
          window.__STENCIL_INSPECTOR__.getComponent(selectedElement);
        }
      })($0);
    `,
      (_res, err) => {
        if (err) {
          this.uiInstance.changeComponent({
            status: {
              success: false,
              message: 'Could not inject the scout. Try to refresh the panel and/or the inspected window.'
            },
            categories: []
          });
        }

        chrome.devtools.panels.elements.onSelectionChanged.addListener(this.getComponent);
      }
    );
  }

  /** Call the get component function inside the scout */
  private getComponent = () => {
    if (this.uiInstance) {
      this.uiInstance.startLoading();
    }

    this.callScout('getComponent($0)');
  }

  /** Create a readable item for the panel */
  private createItem(receivedItem: Partial<d.ItemData>, actualValue: any): d.ItemData {
    let item: d.ItemData = {
      label: '__unknown__',
      type: typeof actualValue,
      value: actualValue,
      subvalue: null,
      edit: {
        enable: false,
        member: null,
        instance: false,
        type: null
      },
      expand: {
        enable: false,
        value: []
      },
      ...receivedItem
    };

    try {
      if (Array.isArray(actualValue)) {
        item.expand.enable = true;
        item.type = 'array';
        item.value = `Array[${actualValue.length}]`;
        item.expand = {
          enable: true,
          value: actualValue
            .map((actualValueItem, index) => this.createItem({
              label: index
            }, actualValueItem))
        };
      }

      if (actualValue === null) {
        item.type = 'null';
        item.value = 'null';
      } else if (item.type === 'object') {
        switch (actualValue.__stencil_obj_type__) {
          case 'function':
            item.type = 'function';
            item.value = `ƒ ${actualValue.__stencil_obj_name__ || 'unknown'}`;
            item.expand = {
              enable: true,
              value: [
                this.createItem({
                  label: 'body'
                }, actualValue.__stencil_obj_body__)
              ]
            };
            break;

          case 'undefined':
            item.type = 'undefined';
            item.value = 'undefined';
            break;

          case 'window':
            item.type = 'object';
            item.value = 'Window';
            break;

          case 'element':
            item.type = 'node';
            item.value = `<${actualValue.__stencil_obj_name__} />`;
            break;

          case 'value':
            item = this.createItem({
              label: item.label,
              edit: {
                enable: actualValue.__stencil_obj_edit__,
                member: actualValue.__stencil_obj_edit_member__,
                instance: actualValue.__stencil_obj_edit_instance__,
                type: actualValue.__stencil_obj_edit_type__
              }
            }, actualValue.value);
            break;

          default:
            item.value = actualValue.constructor ? actualValue.constructor.name : 'Object';
            item.expand = {
              enable: true,
              value: Object.keys(actualValue)
                .filter(key => !key.startsWith('__stencil_obj'))
                .map(key => this.createItem({
                  label: key
                }, actualValue[key]))
            };

            if (actualValue.__stencil_obj_map_subvalue__) {
              const valueObj = item.expand.value.filter(item => item.label === 'value').pop();

              item.subvalue = valueObj;
            }
        }
      }

      return item;
    } catch (e) {
      return null;
    }
  }

  /** Execute the given method from scout */
  private callScout(method: string) {
    chrome.devtools.inspectedWindow.eval(`window.__STENCIL_INSPECTOR__.${method}`);
  }

  /** Register the panel instance */
  register(uiInstance: Main) {
    this.uiInstance = uiInstance;
  }

  /** Refresh window */
  refresh() {
    window.location.reload();
  }

  /** Call the update value function inside the scout */
  updateValue(prop: string, value: string | number | boolean, type: string, editInstance = false) {
    const formattedValue  = type === 'string' ? `'${value}'` : value.toString();

    this.callScout(`updateValue('${prop}', ${formattedValue}, ${editInstance.toString()})`);
  }
}
