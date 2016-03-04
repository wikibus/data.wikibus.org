using System;
using Microsoft.Owin.Hosting;
using Nancy;
using Nancy.Bootstrapper;
using Owin;
using wikibus.nancy;

namespace data.wikibus.org
{
    internal class Program
    {
        private const int DefaultPort = 17899;

        private static void Main(string[] args)
        {
            int port = DefaultPort;
            if (args.Length > 0)
            {
                int.TryParse(args[0], out port);
            }

            var urlBuilder = new UriBuilder("http://localhost")
            {
                Port = port
            };

            using (WebApp.Start<Startup>(urlBuilder.ToString()))
            {
                Console.WriteLine("started nancy");
                Console.ReadLine();
            }
        }
    }

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
