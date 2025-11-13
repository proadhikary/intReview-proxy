export default async (request) => {
  const targetUrl = 'https://lcs2.pythonanywhere.com' + request.url.replace(request.origin, '');

  const response = await fetch(targetUrl, {
    headers: { "Host": "lcs2.pythonanywhere.com" },
    redirect: "follow"
  });

  return response;
};