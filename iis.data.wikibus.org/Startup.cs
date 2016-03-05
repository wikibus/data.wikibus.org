using System;
using data.wikibus.org;
using Microsoft.Owin;
using Nancy;
using Owin;
using wikibus.nancy;

[assembly: OwinStartup(typeof(Startup))]

namespace data.wikibus.org
{
    internal class Startup
    {
        public void Configuration(IAppBuilder builder)
        {
            builder.Use(async (context, func) =>
            {
                Console.WriteLine(context.Request.Uri);
                await func();
            });

#if DEBUG
            StaticConfiguration.DisableErrorTraces = false;
#endif
            builder.UseNancy(options => options.Bootstrapper = new Bootstrapper());
        }
    }
}
