﻿using CodeStream.VisualStudio.Core.Logging;
using CodeStream.VisualStudio.Events;
using CodeStream.VisualStudio.Models;
using CodeStream.VisualStudio.Services;
using Serilog;
using Task = System.Threading.Tasks.Task;

namespace CodeStream.VisualStudio.Controllers
{
    public class ConfigurationController
    {
        private static readonly ILogger Log = LogManager.ForContext<ConfigurationController>();

        private readonly IEventAggregator _eventAggregator;
        private readonly IWebviewIpc _ipc;

        public ConfigurationController(IEventAggregator eventAggregator, IWebviewIpc ipc)
        {
            _eventAggregator = eventAggregator;
            _ipc = ipc;
        }

        public async Task ToggleShowMarkersAsync(bool value)
        {
            _eventAggregator.Publish(new MarkerVisibilityEvent { IsVisible = value });
            _ipc.Notify(new HostDidChangeConfigNotificationType
            {
                Params = new HostDidChangeConfigNotification
                {
                    ShowMarkers = value
                }
            });

            Log.Verbose($"{nameof(ToggleShowMarkersAsync)} Value={value}");

            await Task.CompletedTask;
        }

        public async Task ToggleMuteAllAsync(bool value)
        {
            _ipc.Notify(new HostDidChangeConfigNotificationType
            {
                Params = new HostDidChangeConfigNotification
                {
                    MuteAll = value
                }
            });

            Log.Verbose($"{nameof(ToggleMuteAllAsync)} Value={value}");

            await Task.CompletedTask;
        }

        public async Task ToggleViewCodemarksInlineAsync(bool value)
        {
            _ipc.Notify(new HostDidChangeConfigNotificationType
            {
                Params = new HostDidChangeConfigNotification
                {
                    ViewCodemarksInline = value
                }
            });

            Log.Verbose($"{nameof(ToggleViewCodemarksInlineAsync)} Value={value}");

            await Task.CompletedTask;
        }
    }
}
