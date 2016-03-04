using System;
using wikibus.sources.dotNetRDF;

namespace data.wikibus.org
{
    public class Configuration : ISourcesDatabaseConnectionStringProvider
    {
        public string ConnectionString
        {
            get { return Environment.GetEnvironmentVariable("wikibus-sql-connectionstring"); }
        }
    }
}