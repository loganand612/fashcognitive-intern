import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const TemplateView = () => {
  const { id } = useParams();
  const [template, setTemplate] = useState<any>(null);

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/api/users/templates/${id}/`)
      .then((res)=>{
        console.log("Logo URL:", res.data.logo); 
        setTemplate(res.data);
      })
      .catch((err) => console.error("Failed to load template", err));
  }, [id]);

  if (!template) return <p>Loading...</p>;

  return (
    <div className="template-detail">
      <h1>{template.title}</h1>
      <p>{template.description}</p>

      {template.logo && (
        <img
          src={template.logo}
          alt="Template Logo"
          style={{ width: 150 }}
        />
      )}

      {template.sections.map((section: any) => (
        <div key={section.id}>
          <h3>{section.title}</h3>
          <ul>
            {section.questions.map((q: any) => (
              <li key={q.id}>
                {q.text} ({q.response_type})
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default TemplateView;
