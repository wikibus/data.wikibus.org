using System;
using System.Configuration;
using data.wikibus.org;
using Microsoft.Owin;
using Nancy;
using Owin;
using wikibus.nancy;
using wikibus.sources.dotNetRDF;

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

            StaticConfiguration.DisableErrorTraces = false;
            builder.UseNancy(options => options.Bootstrapper = new Bootstrapper());
        }
    }

    public class Settings : ISourcesDatabaseConnectionStringProvider
    {
        public string ConnectionString
        {
            get { return ConfigurationManager.ConnectionStrings["sql"].ConnectionString; }
        }
    }
}
